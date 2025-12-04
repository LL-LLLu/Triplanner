import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from './generated/client/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

console.log("Starting server initialization...");

dotenv.config();

const app = express();

let prisma: PrismaClient;

if (process.env.VERCEL) {
    // Production: Use standard client (Postgres)
    prisma = new PrismaClient();
} else {
    // Local: Use Better-SQLite3 Adapter
    const adapter = new PrismaBetterSqlite3({
      url: process.env.DATABASE_URL || 'file:./dev.db'
    });
    prisma = new PrismaClient({ adapter });
}

const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY && process.env.NODE_ENV === 'production') {
    throw new Error("FATAL: JWT_SECRET is not set in production environment.");
}
const FINAL_SECRET_KEY = SECRET_KEY || 'dev-secret-do-not-use-in-prod';

// Security: Restrict CORS
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    process.env.FRONTEND_URL // Allow production URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        console.log("Request Origin:", origin); // Debug log
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // In development, allow ANY origin
        if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
             return callback(null, true);
        }
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));

app.use(express.json());

// --- Validation Helpers ---
const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
const sanitizeInput = (str: string) => str.replace(/[^\w\s,.-]/gi, '').trim().substring(0, 100); // Basic sanitization

// --- Types ---
interface AuthRequest extends Request {
    user?: { id: number; role: string };
}

// --- Middleware ---
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

// Register
app.post('/auth/register', async (req: Request, res: Response) => {
    // SECURITY: Registration is CLOSED. Only pre-seeded accounts are allowed.
    res.status(403).json({ error: 'Public registration is closed. Please use a provided test account.' });
    return;
});

// Login
app.post('/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    if (!email || !password || !isValidEmail(email)) {
        res.status(400).json({ error: 'Invalid email or password format' });
        return;
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(400).json({ error: 'User not found' });
            return;
        }

        if (user.status !== 'ACTIVE') {
            res.status(403).json({ error: 'Account is pending approval.' });
            return;
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            res.status(400).json({ error: 'Invalid password' });
            return;
        }

        const token = jwt.sign({ id: user.id, role: user.role }, FINAL_SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// --- Trip Routes ---

// Get All Trips for User
app.get('/api/trips', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const trips = await prisma.trip.findMany({
            where: { userId: req.user!.id },
            orderBy: { createdAt: 'desc' }
        });
        // Parse itinerary JSON for client
        const parsedTrips = trips.map(t => ({
            ...t,
            itinerary: JSON.parse(t.itinerary)
        }));
        res.json(parsedTrips);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch trips' });
    }
});

// Create Trip (Save)
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

// Update Trip Itinerary
app.put('/api/trips/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { itinerary } = req.body;
    
    try {
        // Verify ownership
        const existingTrip = await prisma.trip.findUnique({ where: { id: Number(id) } });
        if (!existingTrip || existingTrip.userId !== req.user!.id) {
             res.status(403).json({ error: 'Not authorized' });
             return;
        }

        const updatedTrip = await prisma.trip.update({
            where: { id: Number(id) },
            data: {
                itinerary: JSON.stringify(itinerary)
            }
        });
        res.json({ ...updatedTrip, itinerary: JSON.parse(updatedTrip.itinerary) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update trip' });
    }
});

// Delete Trip
app.delete('/api/trips/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        // Verify ownership
        const existingTrip = await prisma.trip.findUnique({ where: { id: Number(id) } });
        if (!existingTrip || existingTrip.userId !== req.user!.id) {
             res.status(403).json({ error: 'Not authorized' });
             return;
        }

        await prisma.trip.delete({ where: { id: Number(id) } });
        res.json({ message: 'Trip deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete trip' });
    }
});

// --- AI Planning Route (Gemini) ---
app.post('/api/plan', authenticateToken, async (req: AuthRequest, res: Response) => {
    let { originCity, destinations, days, budget, mustVisit } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        res.status(500).json({ error: 'Server misconfigured: Missing API Key' });
        return;
    }

    // Validation & Sanitization
    if (!destinations || (Array.isArray(destinations) && destinations.length === 0)) {
         res.status(400).json({ error: 'Destinations are required' });
         return;
    }
    
    // Sanitize inputs to prevent prompt injection
    const originString = originCity ? sanitizeInput(originCity) : "User's Origin";
    const destList = Array.isArray(destinations) ? destinations : [destinations];
    const destString = destList.map((d: string) => sanitizeInput(d)).join(", ");
    const mustVisitString = Array.isArray(mustVisit) ? mustVisit.map((m: string) => sanitizeInput(m)).join(", ") : "None";
    const safeBudget = ['Budget', 'Moderate', 'Luxury'].includes(budget) ? budget : 'Moderate';
    const safeDays = Math.min(Math.max(Number(days) || 3, 1), 14); // Limit days 1-14

    const prompt = `
        Role: Expert Travel Planner.
        Task: Create a detailed ${safeDays}-day trip itinerary specifically for: ${destString}.
        Origin: ${originString}.
        
        Requirements:
        1. FLIGHTS: Suggest realistic flight/train routes.
        2. HOTELS: Suggest 3-4 distinct hotel options (different price points/styles) valid for the entire stay.
        3. DINING: Suggest at least 2 distinct restaurants (Lunch/Dinner) per day. Total of ${safeDays * 2} minimum.
        4. ACTIVITIES: Detailed itinerary for ${safeDays} days.
        5. COSTS: Provide "estimatedCost" (number) for EVERY single item.
        
        Constraint: ALL suggestions MUST be within or very close to ${destString}. Do NOT suggest places in other countries or far away cities unless explicitly asked.
        User Preferences: Budget: ${safeBudget}, Must-Visit: [${mustVisitString}].
        
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
          "costs": { "total": "Calculated Total", "currency": "USD", "breakdown": { "flights": "...", "accommodation": "...", "food": "...", "activities": "...", "transport": "..." } }
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

        // Parse the text response
        let jsonText = data.candidates[0].content.parts[0].text;
        // Clean markdown
        jsonText = jsonText.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        const plan = JSON.parse(jsonText);
        res.json(plan);

    } catch (error: any) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: error.message || 'Failed to generate plan' });
    }
});

// Start Server (for local dev) or Export (for Vercel)
if (process.env.VERCEL) {
    module.exports = app;
} else {
    try {
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (e) {
        console.error("Failed to start server:", e);
    }
}