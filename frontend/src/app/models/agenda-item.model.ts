// Base interface for all agenda items
export interface BaseAgendaItem {
  id: number;
  title: string;
  presenter: string;
  duration: number;
  description: string;
  tipoPunto: string;
  documents: string[];
  notes: string;
}

// Specialized interfaces for each type
export interface ApprovalAgendaItem extends BaseAgendaItem {
  tipoPunto: 'Aprobaciones';
  requiresVoting: true;
  decision?: 'Approved' | 'Rejected' | 'Deferred';
}

export interface InformationalAgendaItem extends BaseAgendaItem {
  tipoPunto: 'informativa';
  requiresVoting: false;
}

export interface StrategicAgendaItem extends BaseAgendaItem {
  tipoPunto: 'fondo estrategia y desarrollo';
  requiresVoting: false;
  strategicCategory?: string;
}

export interface MiscellaneousAgendaItem extends BaseAgendaItem {
  tipoPunto: 'varios';
  requiresVoting: false;
}

// Union type to represent any agenda item
export type AgendaItem = 
  | ApprovalAgendaItem 
  | InformationalAgendaItem 
  | StrategicAgendaItem 
  | MiscellaneousAgendaItem;

// Factory to create the appropriate agenda item type
export class AgendaItemFactory {
  static create(type: string, data: Partial<BaseAgendaItem>): AgendaItem {
    switch(type) {
      case 'Aprobaciones':
        return {
          ...this.createBaseItem(data),
          tipoPunto: 'Aprobaciones',
          requiresVoting: true
        };
      case 'informativa':
        return {
          ...this.createBaseItem(data),
          tipoPunto: 'informativa',
          requiresVoting: false
        };
      case 'fondo estrategia y desarrollo':
        return {
          ...this.createBaseItem(data),
          tipoPunto: 'fondo estrategia y desarrollo',
          requiresVoting: false
        };
      case 'varios':
      default:
        return {
          ...this.createBaseItem(data),
          tipoPunto: 'varios',
          requiresVoting: false
        };
    }
  }

  private static createBaseItem(data: Partial<BaseAgendaItem>): BaseAgendaItem {
    return {
      id: data.id || 0,
      title: data.title || '',
      presenter: data.presenter || '',
      duration: data.duration || 15,
      description: data.description || '',
      tipoPunto: data.tipoPunto || 'informativa',
      documents: data.documents || [],
      notes: data.notes || ''
    };
  }
}