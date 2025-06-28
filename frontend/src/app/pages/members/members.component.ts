import { Component, OnInit } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule }        from '@angular/forms';
import { LucideAngularModule }from 'lucide-angular';
import { saveAs } from 'file-saver';

import { MemberService, Member } from '../../services/member.service';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './members.component.html',
})
export class MembersComponent implements OnInit {
  members: Member[] = [];
  searchQuery = '';

  // dialog state
  isAddOpen    = false;
  isDeleteOpen = false;
  selectedEmail: string | null = null;

  // form model (for both add & edit)
  form: Partial<Member & { password: string }> = this.emptyForm();
  errorMsg = '';

  constructor(private svc: MemberService) {}

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.svc.list().subscribe(users => this.members = users);
  }

  filteredMembers(): Member[] {
    const q = this.searchQuery.toLowerCase();
    return this.members.filter(m =>
      (`${m.firstName} ${m.lastName}`.toLowerCase().includes(q)) ||
      m.position.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    );
  }

  emptyForm() {
    return {
      firstName:    '',
      lastName:     '',
      email:        '',
      password:     '',
      tipoUsuario:  'JDMEMBER' as const,
      position:     'Unassigned',
      organization: 'Unassigned',
      status:       'Active' as 'Active'|'Inactive'
    };
  }

  // — Add Member —
  openAdd() {
    this.selectedEmail = null;
    this.form        = this.emptyForm();
    this.errorMsg    = '';
    this.isAddOpen   = true;
  }

  // — Edit Member —
  openEdit(email: string) {
    this.selectedEmail  = email;
    this.errorMsg    = '';
    this.svc.get(email).subscribe({
      next: user => {
        this.form = {
          firstName:    user.firstName,
          lastName:     user.lastName,
          email:        user.email,
          // for edit we do not touch password
          position:     user.position,
          organization: user.organization,
          tipoUsuario:  user.tipoUsuario,
          status:       user.status
        };
        this.isAddOpen = true;
      },
      error: console.error
    });
  }

  // — Save either new or edited —
  doSave() {
    this.errorMsg = '';
    // basic required validations
    if (!this.form.firstName || !this.form.lastName || !this.form.email) {
      this.errorMsg = 'Name and email are required.';
      return;
    }
    if (!this.selectedEmail && !this.form.password) {
      this.errorMsg = 'Password is required for new user.';
      return;
    }

    if (this.selectedEmail) {
      // UPDATE - Don't allow role changes
      const updatePayload = {
        firstName: this.form.firstName,
        lastName: this.form.lastName,
        email: this.form.email,
        position: this.form.position,
        organization: this.form.organization,
        status: this.form.status
        // Explicitly exclude tipoUsuario from updates
      };
      this.svc.update(this.selectedEmail, updatePayload).subscribe({
        next: () => { this.isAddOpen = false; this.reload(); },
        error: e => this.errorMsg = e.error?.message || 'Server error'
      });
    } else {
      // CREATE - Use default role
      const createPayload = {
        ...this.form,
        tipoUsuario: 'JDMEMBER' // Force default role for new users
      };
      this.svc.create(createPayload as any).subscribe({
        next: () => { this.isAddOpen = false; this.reload(); },
        error: e => this.errorMsg = e.error?.message || 'Server error'
      });
    }
  }

  // — Delete Member —
  openDelete(email: string) {
    this.selectedEmail  = email;
    this.isDeleteOpen = true;
  }
  doDelete() {
    if (!this.selectedEmail) return;
    this.svc.delete(this.selectedEmail).subscribe({
      next: () => { this.isDeleteOpen = false; this.reload(); },
      error: console.error
    });
  }

  // — CSV download —
  downloadAll() {
    this.svc.list().subscribe(users => {
      // CSV headers
      const header = ['Name','Position','Email','Role','Status'];
      const rows = users.map(u => [
        `${u.firstName} ${u.lastName}`,
        u.position,
        u.email,
        u.position,
        u.status
      ]);

      // build CSV string
      const csv = [
        header.join(','),
        ...rows.map(r => r.map(cell => `"${cell.replace(/"/g,'""')}"`).join(','))
      ].join('\r\n');

      // trigger download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, 'members.csv');
    });
  }
}
