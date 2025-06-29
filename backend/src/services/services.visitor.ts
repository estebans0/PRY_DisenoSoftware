
import { Session } from '../models/session.model';
import { AbsentSessionsVisitor, ResponsiblePointsVisitor, SessionsByPresenterVisitor } from '../Visitor/sessionVisitor';

export class SessionQueryService {
    async getSessionsByPresenter(presenterName: string): Promise<any[]> {
        if (!presenterName || typeof presenterName !== 'string' || presenterName.trim() === '') {
        throw new Error('Valid presenter name is required');
        }

        const visitor = new SessionsByPresenterVisitor(presenterName);
        const sessions = await Session.find({
        'agenda.presenter': presenterName
        }).populate('agenda');

        for (const session of sessions) {
        await session.accept(visitor);
        }

        return visitor.getResults();
    }

    async getResponsiblePoints(responsibleName: string): Promise<any[]> {
        if (!responsibleName || typeof responsibleName !== 'string' || responsibleName.trim() === '') {
            throw new Error('Valid responsible name is required');
        }

        const visitor = new ResponsiblePointsVisitor(responsibleName);
        const sessions = await Session.find({
            'agenda.actions.assignee.name': responsibleName
        }).populate('agenda');

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


