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
  selectedId: string | null = null;

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
      tipoUsuario:  'USUARIO' as const,
      position:     'Unassigned',
      organization: 'Unassigned',
      status:       'Active' as 'Active'|'Inactive'
    };
  }

  // — Add Member —
  openAdd() {
    this.selectedId = null;
    this.form        = this.emptyForm();
    this.errorMsg    = '';
    this.isAddOpen   = true;
  }

  // — Edit Member —
  openEdit(id: string) {
    this.selectedId  = id;
    this.errorMsg    = '';
    this.svc.get(id).subscribe({
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
    if (!this.selectedId && !this.form.password) {
      this.errorMsg = 'Password is required for new user.';
      return;
    }

    if (this.selectedId) {
      // UPDATE
      this.svc.update(this.selectedId, this.form).subscribe({
        next: () => { this.isAddOpen = false; this.reload(); },
        error: e => this.errorMsg = e.error?.message || 'Server error'
      });
    } else {
      // CREATE
      this.svc.create(this.form as any).subscribe({
        next: () => { this.isAddOpen = false; this.reload(); },
        error: e => this.errorMsg = e.error?.message || 'Server error'
      });
    }
  }

  // — Delete Member —
  openDelete(id: string) {
    this.selectedId  = id;
    this.isDeleteOpen = true;
  }
  doDelete() {
    if (!this.selectedId) return;
    this.svc.delete(this.selectedId).subscribe({
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
