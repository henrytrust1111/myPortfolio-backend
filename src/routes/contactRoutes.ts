import express from 'express';
import {
  createContact,
  getContacts,
  updateContactStatus,
} from '../controllers/contactController';

const router = express.Router();

router.post('/contact', createContact);
router.get('/contacts', getContacts);
router.patch('/contacts/:id', updateContactStatus);

export default router;