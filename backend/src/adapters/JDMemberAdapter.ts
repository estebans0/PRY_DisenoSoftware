import { User, UserModel } from '../models/user.model';
import { JDMember, JDMemberModel } from '../models/JDMember.model';

/**
 * JDMemberAdapter - Adapts User operations to JDMember operations
 * Acts as an adapter between the User domain and JDMember domain
 */
export class JDMemberAdapter {
  /**
   * Adapts User data to JDMember format and creates/updates JDMember
   */
  public static async adaptUser(user: User): Promise<JDMember | null> {
    if (user.tipoUsuario !== 'JDMEMBER') {
      return null;
    }

    try {
      console.log('Adapting user:', { email: user.email, firstName: user.firstName, lastName: user.lastName });
      
      // Check if JDMember already exists with this email
      const existingJDMember = await JDMemberModel.findOne({ email: user.email });
      console.log('Existing JDMember found:', existingJDMember ? 'YES' : 'NO');
      
      if (existingJDMember) {
        console.log('Updating existing JDMember');
        // Update existing JDMember
        existingJDMember.firstName = user.firstName;
        existingJDMember.lastName = user.lastName;
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
   */
  public static async removeJDMember(user: User): Promise<void> {
    if (user.tipoUsuario !== 'JDMEMBER') return;

    try {
      await JDMemberModel.findOneAndDelete({ email: user.email });
    } catch (error) {
      console.error('Error removing JDMember:', error);
    }
  }
}