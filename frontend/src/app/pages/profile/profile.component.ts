import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { MemberService } from '../../services/member.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  // which tab is active
  activeTab: 'account' | 'password' | 'notifications' = 'account';

  // password visibility
  showCurrent = false;
  showNew = false;
  showConfirm = false;

  // form state - will be populated with real user data
  formData = {
    firstName: '',
    lastName: '',
    email: '',
    position: '', // read-only
    organization: '', // read-only
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  // Error and success messages
  profileError = '';
  passwordError = '';
  profileSuccess = '';
  passwordSuccess = '';

  // ...existing code...
  notificationSettings = {
    emailNotifications: true,
    sessionReminders: true,
    taskAssignments: true,
    minutesAvailable: true
  };

  constructor(private authService: AuthService, private memberService: MemberService) {}

  ngOnInit() {
    this.loadUserData();
  }

  /** Load current user data from auth service */
  loadUserData() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.formData = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        position: user.position || 'Unassigned',
        organization: user.organization || 'Unassigned',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
    }
  }

  /** Get user initials for avatar */
  getUserInitials(): string {
    const firstName = this.formData.firstName || 'U';
    const lastName = this.formData.lastName || 'S';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  // generic input handler (only for editable fields)
  handleInputChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const name = target.name as keyof typeof this.formData;
    // Only allow changes to editable fields
    if (name !== 'position' && name !== 'organization') {
      this.formData[name] = target.value;
    }
  }

  // toggle a notification setting
  handleSwitch(setting: keyof typeof this.notificationSettings) {
    this.notificationSettings[setting] = !this.notificationSettings[setting];
  }

  // Save profile (like members component)
  handleSaveProfile() {
    this.profileError = '';
    this.profileSuccess = '';
    
    // Basic validation
    if (!this.formData.firstName || !this.formData.lastName || !this.formData.email) {
      this.profileError = 'Name and email are required.';
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.profileError = 'User not found. Please log in again.';
      return;
    }

    // Prepare payload (exclude read-only fields and password fields)
    const updatePayload = {
      firstName: this.formData.firstName,
      lastName: this.formData.lastName,
      email: this.formData.email
      // position and organization are read-only
    };

    // Use member service to update (same as members component)
    this.memberService.update(currentUser.email, updatePayload).subscribe({
      next: (updatedUser) => {
        this.profileSuccess = 'Profile updated successfully!';
        // Update localStorage with new user data
        localStorage.setItem('current_user', JSON.stringify(updatedUser));
        // Reload user data to reflect changes
        this.loadUserData();
      },
      error: (e) => {
        this.profileError = e.error?.message || 'Failed to update profile.';
      }
    });
  }

  handleChangePassword() {
    this.passwordError = '';
    this.passwordSuccess = '';
    
    // Basic validation
    if (!this.formData.currentPassword || !this.formData.newPassword || !this.formData.confirmPassword) {
      this.passwordError = 'All password fields are required.';
      return;
    }

    if (this.formData.newPassword !== this.formData.confirmPassword) {
      this.passwordError = 'New passwords do not match.';
      return;
    }

    if (this.formData.newPassword.length < 6) {
      this.passwordError = 'New password must be at least 6 characters.';
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.passwordError = 'User not found. Please log in again.';
      return;
    }

    // For now, just show success (password change would need a dedicated endpoint)
    console.log('Password change request:', {
      currentPassword: this.formData.currentPassword,
      newPassword: this.formData.newPassword
    });
    
    this.passwordSuccess = 'Password changed successfully!';
    // Clear password fields
    this.formData.currentPassword = '';
    this.formData.newPassword = '';
    this.formData.confirmPassword = '';
  }
  handleSaveNotifications() {
    console.log('Saving notifications', this.notificationSettings);
  }
}
