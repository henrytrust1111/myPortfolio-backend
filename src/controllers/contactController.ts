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
      const messages = Object.keys(errs)
        .map((k) => errs[k]?.message)
        .filter(Boolean) as string[];
      const message = messages.length === 1 ? messages[0] : messages.join('; ');
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