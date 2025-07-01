import { User, UserModel } from '../models/user.model';
import { JDMember, JDMemberModel } from '../models/JDMember.model';

/**
 * JDMemberAdapter - Adapts User operations to JDMember operations
 * Acts as an adapter between the User domain and JDMember domain
 */
export class JDMemberAdapter {
  /**
   * Adapts User data to JDMember format and creates/updates JDMember
   * @param user The user data to adapt
   * @param originalEmail The original email before any updates (used to find existing JDMember)
   */
  public static async adaptUser(user: User, originalEmail?: string): Promise<JDMember | null> {
    if (user.tipoUsuario !== 'JDMEMBER') {
      return null;
    }

    try {
      console.log('Adapting user:', { 
        email: user.email, 
        originalEmail: originalEmail,
        firstName: user.firstName, 
        lastName: user.lastName 
      });
      
      // Use originalEmail if provided (for updates), otherwise use current email
      const emailToSearch = originalEmail || user.email;
      
      // Check if JDMember already exists with the search email
      const existingJDMember = await JDMemberModel.findOne({ email: emailToSearch });
      console.log('Existing JDMember found:', existingJDMember ? 'YES' : 'NO');
      
      if (existingJDMember) {
        console.log('Updating existing JDMember');
        // Update existing JDMember with new data (including potentially new email)
        existingJDMember.firstName = user.firstName;
        existingJDMember.lastName = user.lastName;
        existingJDMember.email = user.email; // Update email to new value
        existingJDMember.position = user.position;
        const updated = await existingJDMember.save();
        console.log('Updated JDMember:', updated);
        return updated;
      } else {
        console.log('Creating new JDMember');
        // Create new JDMember
        const newJDMember = new JDMemberModel({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          position: user.position
        });
        const created = await newJDMember.save();
        console.log('Created JDMember:', created);
        return created;
      }
    } catch (error) {
      console.error('Error adapting User to JDMember:', error);
      return null;
    }
  }

  /**
   * Removes the corresponding JDMember when a User is deleted
   * @param user The user to remove
   * @param originalEmail The original email if it was changed (used to find existing JDMember)
   */
  public static async removeJDMember(user: User, originalEmail?: string): Promise<void> {
    if (user.tipoUsuario !== 'JDMEMBER') return;

    try {
      // Use originalEmail if provided, otherwise use current email
      const emailToSearch = originalEmail || user.email;
      await JDMemberModel.findOneAndDelete({ email: emailToSearch });
      console.log('Removed JDMember with email:', emailToSearch);
    } catch (error) {
      console.error('Error removing JDMember:', error);
    }
  }
}