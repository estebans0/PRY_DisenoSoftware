import { Session } from '../models/session.model';
import { AbsentSessionsVisitor, ResponsiblePointsVisitor, SessionsByPresenterVisitor } from '../Visitor/sessionVisitor';

export class SessionQueryService {
    async getSessionsByPresenter(presenterEmail: string): Promise<any[]> {
        const visitor = new SessionsByPresenterVisitor(presenterEmail);
        const sessions = await Session.find({});
        
        for (const session of sessions) {
            await session.accept(visitor);
        }
        
        return visitor.getResults();
    }

    async getResponsiblePoints(responsibleEmail: string): Promise<any[]> {
        const visitor = new ResponsiblePointsVisitor(responsibleEmail);
        const sessions = await Session.find({});
        
        for (const session of sessions) {
            await session.accept(visitor);
        }
        
        return visitor.getResults();
    }

    async getAbsentSessions(memberEmail: string): Promise<any[]> {
        const visitor = new AbsentSessionsVisitor(memberEmail);
        const sessions = await Session.find({});
        
        for (const session of sessions) {
            await session.accept(visitor);
        }
        
        return visitor.getResults();
    }

    async getSessionsInDateRange(start: Date, end: Date): Promise<any[]> {
        return Session.find({
            date: { $gte: start, $lte: end }
        });
    }

    async getSessionById(sessionId: string): Promise<any> {
        return Session.findById(sessionId);
    }
}