import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {
  // which tab is active
  activeTab: 'account' | 'password' | 'notifications' = 'account';

  // password visibility
  showCurrent = false;
  showNew = false;
  showConfirm = false;

  // form state
  formData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    position: 'Chairperson',
    organization: 'Example Organization',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  // notification toggles
  notificationSettings = {
    emailNotifications: true,
    sessionReminders: true,
    taskAssignments: true,
    minutesAvailable: true
  };

  // generic input handler
  handleInputChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const name = target.name as keyof typeof this.formData;
    this.formData[name] = target.value;
  }

  // toggle a notification setting
  handleSwitch(setting: keyof typeof this.notificationSettings) {
    this.notificationSettings[setting] = !this.notificationSettings[setting];
  }

  // stubbed actions
  handleSaveProfile() {
    console.log('Saving profile', this.formData);
  }
  handleChangePassword() {
    console.log('Changing password', {
      current: this.formData.currentPassword,
      new: this.formData.newPassword,
      confirm: this.formData.confirmPassword
    });
  }
  handleSaveNotifications() {
    console.log('Saving notifications', this.notificationSettings);
  }
}
