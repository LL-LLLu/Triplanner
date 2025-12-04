import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createRequire } from 'module';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

console.log("Starting server initialization...");

dotenv.config();

const app = express();

// --- Database Setup ---
let prisma: any;
if (process.env.VERCEL) {
    console.log("Initializing Prisma Client for Vercel (PG Adapter)...");
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
} else {
    const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
    prisma = new PrismaClient({ adapter });
}

const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET;

// Enforce Secret in Production
if (!SECRET_KEY && process.env.NODE_ENV === 'production') {
    throw new Error("FATAL: JWT_SECRET is not set.");
}
const FINAL_SECRET_KEY = SECRET_KEY || 'dev-secret-do-not-use-in-prod';

// --- Security: CORS ---
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // Allow non-browser requests
        
        // Allow Localhost in Development
        if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
             return callback(null, true);
        }

        // Allow Vercel Preview/Prod Domains
        if (origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('CORS policy violation'), false);
        }
        return callback(null, true);
    }
}));

app.use(express.json());

// --- Validation Schemas ---
const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});

const PlanSchema = z.object({
    destinations: z.union([z.string(), z.array(z.string())]),
    days: z.number().min(1).max(14).or(z.string().transform(Number)),
    budget: z.enum(['Budget', 'Moderate', 'Luxury']).optional().default('Moderate'),
    originCity: z.string().optional(),
    mustVisit: z.array(z.string()).optional()
});

// --- Types & Middleware ---
interface AuthRequest extends Request {
    user?: { id: number; role: string };
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.sendStatus(401);
        return;
    }

    jwt.verify(token, FINAL_SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user as { id: number; role: string };
        next();
    });
};

// --- Auth Routes ---

app.post('/auth/register', async (req: Request, res: Response) => {
    // Security: Registration Closed
    res.status(403).json({ error: 'Registration is currently closed. Please use a provided test account.' });
});

app.post('/auth/login', async (req: Request, res: Response) => {
    const result = LoginSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: 'Invalid email or password format' });
        return;
    }
    
    const { email, password } = result.data;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(400).json({ error: 'User not found' });
            return;
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            res.status(400).json({ error: 'Invalid password' });
            return;
        }

        if (user.status !== 'ACTIVE') {
            res.status(403).json({ error: 'Account is not active.' });
            return;
        }

        const token = jwt.sign({ id: user.id, role: user.role }, FINAL_SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// --- Trip Routes ---

app.get('/api/trips', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const trips = await prisma.trip.findMany({
            where: { userId: req.user!.id },
            orderBy: { createdAt: 'desc' }
        });
        const parsedTrips = trips.map((t: any) => ({
            ...t,
            itinerary: JSON.parse(t.itinerary)
        }));
        res.json(parsedTrips);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch trips' });
    }
});

app.post('/api/trips', authenticateToken, async (req: AuthRequest, res: Response) => {
    const { destinations, startDate, duration, budget, itinerary } = req.body;
    try {
        const trip = await prisma.trip.create({
            data: {
                userId: req.user!.id,
                destinations,
                startDate: startDate ? new Date(startDate) : null,
                duration,
                budget,
                itinerary: JSON.stringify(itinerary)
            }
        });
        res.status(201).json(trip);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save trip' });
    }
});

app.put('/api/trips/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { itinerary } = req.body;
    try {
        const existing = await prisma.trip.findUnique({ where: { id: Number(id) }});
        if (!existing || existing.userId !== req.user!.id) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }

        const updatedTrip = await prisma.trip.update({
            where: { id: Number(id) },
            data: { itinerary: JSON.stringify(itinerary) }
        });
        res.json({ ...updatedTrip, itinerary: JSON.parse(updatedTrip.itinerary) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update trip' });
    }
});

app.delete('/api/trips/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const existing = await prisma.trip.findUnique({ where: { id: Number(id) }});
        if (!existing || existing.userId !== req.user!.id) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        await prisma.trip.delete({ where: { id: Number(id) } });
        res.json({ message: 'Trip deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete trip' });
    }
});

// --- AI Planning Route ---
app.post('/api/plan', authenticateToken, async (req: AuthRequest, res: Response) => {
    const validation = PlanSchema.safeParse(req.body);
    if (!validation.success) {
        res.status(400).json({ error: 'Invalid trip parameters', details: validation.error });
        return;
    }

    const { originCity, destinations, days, budget, mustVisit } = validation.data;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        res.status(500).json({ error: 'Server misconfigured: Missing API Key' });
        return;
    }

    const destString = Array.isArray(destinations) ? destinations.join(", ") : destinations;
    const mustVisitString = mustVisit && mustVisit.length > 0 ? mustVisit.join(", ") : "None";
    const originString = originCity || "User's Origin";
    
    const prompt = `
        Role: Expert Travel Planner.
        Task: Create a detailed ${days}-day trip itinerary specifically for: ${destString}.
        Origin: ${originString}.
        
        Requirements:
        1. FLIGHTS: Suggest realistic flight/train routes.
        2. HOTELS: Suggest 3-4 distinct hotel options (different price points/styles) valid for the entire stay.
        3. DINING: Suggest at least 2 distinct restaurants (Lunch/Dinner) per day. Total of ${Number(days) * 2} minimum.
        4. ACTIVITIES: Detailed itinerary for ${days} days.
        5. COSTS: Provide "estimatedCost" (number) for EVERY single item.
        
        Constraint: ALL suggestions MUST be within or very close to ${destString}. Do NOT suggest places in other countries or far away cities unless explicitly asked.
        User Preferences: Budget: ${budget}, Must-Visit: [${mustVisitString}].
        
        Output Format: JSON ONLY. No markdown.
        {
          "flights": [{ "from": "...", "to": "...", "type": "Flight", "description": "...", "estimatedCost": 500, "searchQuery": "..." }],
          "hotels": [
             { "name": "Hotel A", "type": "Hotel", "city": "...", "coordinates": { "lat": 0, "lng": 0 }, "description": "Luxury option...", "searchQuery": "...", "estimatedCost": 200 }
          ],
          "restaurants": [
             { "name": "Rest A", "type": "Restaurant", "day": 1, "time": "Lunch", "city": "...", "coordinates": { "lat": 0, "lng": 0 }, "description": "Local cuisine...", "estimatedCost": 30 }
          ],
          "itinerary": [
             { "name": "Place A", "type": "Attraction", "day": 1, "time": "Morning", "city": "...", "coordinates": { "lat": 0, "lng": 0 }, "description": "...", "estimatedCost": 20 }
          ],
          "costs": { "total": "...", "currency": "USD", "breakdown": { ... } }
        }
    `;

    try {
        const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data: any = await apiResponse.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        let jsonText = data.candidates[0].content.parts[0].text;
        jsonText = jsonText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const plan = JSON.parse(jsonText);
        res.json(plan);

    } catch (error: any) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: error.message || 'Failed to generate plan' });
    }
});

// Start Server
if (!process.env.VERCEL) {
    try {
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (e) {
        console.error("Failed to start server:", e);
    }
}

export default app;