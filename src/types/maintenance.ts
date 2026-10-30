export type TicketStatus = 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface MaintenanceTicket {
  id: string;
  faultId?: string;
  lightId: string;
  lightName: string;
  ward: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTechnician?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  inspectionNotes?: string[];
  partsReplaced?: string[];
}

