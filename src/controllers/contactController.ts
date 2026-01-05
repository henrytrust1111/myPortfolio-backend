import { Request, Response } from 'express';
import ContactMessage from '../models/ContactMessage';
import { sendContactNotification } from '../services/emailService';

export async function createContact(req: Request, res: Response) {
  try {
    const { name, user_email, Subject, message } = req.body;

    // Validation
    if (!name || !user_email || !Subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Save to database
    const contact = new ContactMessage({ name, user_email, Subject, message });
    await contact.save();

    // Try to send emails; don't fail the request if email sending fails
    try {
      await sendContactNotification(user_email, name, Subject, message);
    } catch (emailErr) {
      console.error('Email send failed:', emailErr);
      return res.status(201).json({
        success: true,
        message: 'Message received but failed to send notification email',
        contactId: contact._id,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message received successfully',
      contactId: contact._id,
    });
  } catch (error) {
    console.error('Contact error:', error);
    if (error && (error as any).name === 'ValidationError') {
      const errs = (error as any).errors || {};

      const friendly = (err: any, field: string) => {
        const kind = err.kind || (err.properties && err.properties.kind) || '';
        // minlength -> "Field must be at least N characters"
        if (kind === 'minlength' || /minimum allowed length/i.test(err.message || '')) {
          const match = String(err.message).match(/minimum allowed length \((\d+)\)/i) || String(err.message).match(/minimum.*?(\d+)/i);
          const min = match ? match[1] : '';
          return `${field.charAt(0).toUpperCase() + field.slice(1)} must be at least ${min || 'the minimum'} characters.`;
        }

        // required
        if (kind === 'required' || /required/i.test(err.message || '')) {
          return `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`;
        }

        // email like field
        if (field.toLowerCase().includes('email')) {
          return 'Please provide a valid email address.';
        }

        // fallback: use a cleaned-up version of the original message
        const cleaned = String(err.message).replace(/Path `.*?`\s*/i, '').replace(/\s*\(.+length.+\)/i, '').trim();
        return `${field.charAt(0).toUpperCase() + field.slice(1)}: ${cleaned}`;
      };

      const messages = Object.keys(errs).map((k) => friendly(errs[k], k));
      const message = messages.length === 1 ? messages[0] : messages.join(' ');
      return res.status(400).json({ error: 'Validation failed', message });
    }

    res.status(500).json({ error: 'Failed to save message' });
  }
}

export async function getContacts(req: Request, res: Response) {
  try {
    const contacts = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

export async function updateContactStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, isRead } = req.body;

    const contact = await ContactMessage.findByIdAndUpdate(
      id,
      { status, isRead },
      { new: true }
    );

    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update message' });
  }
}