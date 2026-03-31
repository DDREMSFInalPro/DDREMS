const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// Middleware: Verify user authentication
const verifyUser = (req, res, next) => {
  const userId = req.query.userId || req.body.sender_id || req.headers['x-user-id'] || req.params.userId;
  if (!userId) return res.status(401).json({ message: 'Unauthorized - User ID required', success: false, code: 'AUTH_REQUIRED' });
  req.userId = parseInt(userId);
  if (isNaN(req.userId)) return res.status(400).json({ message: 'Invalid user ID format', success: false, code: 'INVALID_USER_ID' });
  next();
};

// Middleware: Check send permission
const checkSendPermission = async (req, res, next) => {
  try {
    const { data: user } = await supabase.from('users').select('role, status').eq('id', req.userId).single();
    if (!user) return res.status(401).json({ message: 'User not found', success: false, code: 'USER_NOT_FOUND' });
    if (user.status !== 'active') return res.status(403).json({ message: 'Account is not active', success: false, code: 'ACCOUNT_INACTIVE' });
    const allowedRoles = ['admin', 'system_admin', 'property_admin', 'broker', 'owner', 'user'];
    if (!allowedRoles.includes(user.role)) return res.status(403).json({ message: 'User role not allowed to send messages', success: false, code: 'ROLE_NOT_PERMITTED' });
    req.userRole = user.role;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error during permission check', error: error.message, success: false, code: 'PERMISSION_CHECK_ERROR' });
  }
};

// Get messages for a user (inbox)
router.get('/user/:userId', verifyUser, async (req, res) => {
  try {
    const userIdInt = parseInt(req.params.userId);
    if (isNaN(userIdInt)) return res.status(400).json({ message: 'Invalid user ID format', success: false, code: 'INVALID_USER_ID' });

    const { data: userRow } = await supabase.from('users').select('role, status').eq('id', userIdInt).single();
    if (!userRow) return res.status(404).json({ message: 'User not found', success: false, code: 'USER_NOT_FOUND' });
    if (userRow.status !== 'active') return res.status(403).json({ message: 'Account is not active', success: false, code: 'ACCOUNT_INACTIVE' });

    const role = userRow.role;

    let query = supabase
      .from('messages')
      .select('*, sender:users!sender_id(name, role), receiver:users!receiver_id(name)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (role === 'system_admin') {
      query = query.or(`sender_id.eq.${userIdInt},receiver_id.eq.${userIdInt}`);
    } else if (role === 'property_admin') {
      query = query.or(`sender_id.eq.${userIdInt},receiver_id.eq.${userIdInt}`);
    } else {
      query = query.or(`receiver_id.eq.${userIdInt},sender_id.eq.${userIdInt}`);
    }

    const { data: messages, error } = await query;
    if (error) throw error;

    const processed = messages.map(m => ({
      ...m,
      sender_name: m.sender?.name,
      sender_role: m.sender?.role,
      receiver_name: m.receiver?.name,
    }));

    res.json({ messages: processed, count: processed.length, user_role: role, success: true });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error while fetching messages', error: error.message, success: false, code: 'FETCH_ERROR' });
  }
});

// Admin message history
router.get('/admin/history/:userId', verifyUser, async (req, res) => {
  try {
    const userIdInt = parseInt(req.params.userId);
    const { data: user } = await supabase.from('users').select('role').eq('id', userIdInt).single();
    if (!user || !['system_admin', 'property_admin'].includes(user.role)) {
      return res.status(403).json({ message: 'Access denied - Admin only', success: false });
    }

    const { data: sentMessages } = await supabase.from('messages')
      .select('*, sender:users!sender_id(name, role), receiver:users!receiver_id(name, role)')
      .eq('sender_id', userIdInt).order('created_at', { ascending: false });

    const { data: receivedMessages } = await supabase.from('messages')
      .select('*, sender:users!sender_id(name, role), receiver:users!receiver_id(name, role)')
      .eq('receiver_id', userIdInt).order('created_at', { ascending: false });

    const allMessages = [
      ...(sentMessages || []).map(m => ({ ...m, direction: 'sent' })),
      ...(receivedMessages || []).map(m => ({ ...m, direction: 'received' })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      success: true,
      sent_messages: sentMessages || [],
      received_messages: receivedMessages || [],
      all_messages: allMessages,
      total_sent: sentMessages?.length || 0,
      total_received: receivedMessages?.length || 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Admin conversations list
router.get('/admin/conversations/:userId', verifyUser, async (req, res) => {
  try {
    const userIdInt = parseInt(req.params.userId);
    const { data: user } = await supabase.from('users').select('role').eq('id', userIdInt).single();
    if (!user || !['system_admin', 'property_admin'].includes(user.role)) {
      return res.status(403).json({ message: 'Access denied - Admin only', success: false });
    }

    const { data: messages } = await supabase.from('messages')
      .select('sender_id, receiver_id, created_at, is_read, sender:users!sender_id(name, role, email), receiver:users!receiver_id(name, role, email)')
      .or(`sender_id.eq.${userIdInt},receiver_id.eq.${userIdInt}`)
      .order('created_at', { ascending: false });

    const convMap = {};
    for (const m of messages || []) {
      const otherId = m.sender_id === userIdInt ? m.receiver_id : m.sender_id;
      const other = m.sender_id === userIdInt ? m.receiver : m.sender;
      if (!otherId || !other) continue;
      if (!convMap[otherId]) {
        convMap[otherId] = { other_user_id: otherId, other_user_name: other.name, other_user_role: other.role, other_user_email: other.email, last_message_time: m.created_at, message_count: 0, unread_count: 0 };
      }
      convMap[otherId].message_count++;
      if (m.receiver_id === userIdInt && !m.is_read) convMap[otherId].unread_count++;
    }

    const conversations = Object.values(convMap).sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time));
    res.json({ success: true, conversations, total_conversations: conversations.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Admin conversation thread between two users
router.get('/admin/conversation/:userId/:otherUserId', verifyUser, async (req, res) => {
  try {
    const userIdInt = parseInt(req.params.userId);
    const otherUserIdInt = parseInt(req.params.otherUserId);

    const { data: user } = await supabase.from('users').select('role').eq('id', userIdInt).single();
    if (!user || !['system_admin', 'property_admin'].includes(user.role)) {
      return res.status(403).json({ message: 'Access denied - Admin only', success: false });
    }

    const { data: messages } = await supabase.from('messages')
      .select('*, sender:users!sender_id(name, role), receiver:users!receiver_id(name, role)')
      .or(`and(sender_id.eq.${userIdInt},receiver_id.eq.${otherUserIdInt}),and(sender_id.eq.${otherUserIdInt},receiver_id.eq.${userIdInt})`)
      .order('created_at');

    res.json({ success: true, messages: messages || [], total_messages: messages?.length || 0 });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Get unread count
router.get('/unread/:userId', verifyUser, async (req, res) => {
  try {
    const userIdInt = parseInt(req.params.userId);
    if (req.userId !== userIdInt) return res.status(403).json({ message: 'Access denied', success: false, code: 'ACCESS_DENIED' });

    const { count: singleCount } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', userIdInt).eq('is_read', false).eq('is_group', false);
    const { count: groupCount } = await supabase.from('message_recipients').select('*', { count: 'exact', head: true }).eq('user_id', userIdInt).eq('is_read', false);
    const { count: notifCount } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userIdInt).eq('is_read', false);

    res.json({ count: (singleCount || 0) + (groupCount || 0), single_messages: singleCount || 0, group_messages: groupCount || 0, notifications: notifCount || 0, success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false, code: 'UNREAD_COUNT_ERROR' });
  }
});

// Get notifications via messages route
router.get('/notifications/:userId', verifyUser, async (req, res) => {
  try {
    const userIdInt = parseInt(req.params.userId);
    if (req.userId !== userIdInt) return res.status(403).json({ message: 'Access denied', success: false, code: 'ACCESS_DENIED' });

    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userIdInt).order('created_at', { ascending: false }).limit(10);
    if (error) throw error;
    res.json({ notifications: data, count: data.length, success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false, code: 'NOTIFICATIONS_ERROR' });
  }
});

// Send message (single or group)
router.post('/', verifyUser, checkSendPermission, async (req, res) => {
  try {
    const { receiver_id, receiver_ids, subject, message, message_type, is_group } = req.body;
    const senderIdInt = req.userId;

    if (!subject?.trim()) return res.status(400).json({ message: 'Subject is required', success: false, code: 'SUBJECT_REQUIRED' });
    if (!message?.trim()) return res.status(400).json({ message: 'Message content is required', success: false, code: 'MESSAGE_REQUIRED' });
    if (subject.length > 255) return res.status(400).json({ message: 'Subject cannot exceed 255 characters', success: false, code: 'SUBJECT_TOO_LONG' });
    if (message.length > 5000) return res.status(400).json({ message: 'Message cannot exceed 5000 characters', success: false, code: 'MESSAGE_TOO_LONG' });

    const validTypes = ['general', 'property', 'announcement', 'alert', 'payment', 'verification'];
    const messageType = message_type || 'general';
    if (!validTypes.includes(messageType)) return res.status(400).json({ message: 'Invalid message type', success: false, code: 'INVALID_MESSAGE_TYPE' });

    const isGroupMsg = is_group || (Array.isArray(receiver_ids) && receiver_ids.length > 0);

    if (!isGroupMsg) {
      // Single message
      if (!receiver_id) return res.status(400).json({ message: 'Receiver ID required', success: false, code: 'RECEIVER_REQUIRED' });
      const receiverIdInt = parseInt(receiver_id);
      if (isNaN(receiverIdInt)) return res.status(400).json({ message: 'Invalid receiver ID', success: false, code: 'INVALID_RECEIVER_ID' });
      if (senderIdInt === receiverIdInt) return res.status(400).json({ message: 'Cannot send message to yourself', success: false, code: 'SELF_MESSAGE_NOT_ALLOWED' });

      const { data: receiver } = await supabase.from('users').select('id, name, status').eq('id', receiverIdInt).single();
      if (!receiver) return res.status(404).json({ message: 'Receiver not found', success: false, code: 'RECEIVER_NOT_FOUND' });
      if (receiver.status !== 'active') return res.status(400).json({ message: 'Cannot send message to inactive user', success: false, code: 'RECEIVER_INACTIVE' });

      const { data: newMsg, error } = await supabase.from('messages')
        .insert({ sender_id: senderIdInt, receiver_id: receiverIdInt, subject: subject.trim(), message: message.trim(), message_type: messageType, is_read: false, is_group: false })
        .select('id').single();
      if (error) throw error;

      const { data: sender } = await supabase.from('users').select('name').eq('id', senderIdInt).single();
      await supabase.from('notifications').insert({ user_id: receiverIdInt, title: `New message from ${sender.name}`, message: subject.trim(), type: 'info', is_read: false, link: `/messages/${newMsg.id}` });

      return res.json({ id: newMsg.id, message: 'Message sent successfully', receiver: receiver.name, success: true });
    }

    // Group message
    if (!Array.isArray(receiver_ids) || receiver_ids.length === 0) return res.status(400).json({ message: 'Invalid receiver list', success: false, code: 'INVALID_RECEIVER_LIST' });

    const receiverIdsInt = receiver_ids.map(id => parseInt(id)).filter(id => !isNaN(id) && id !== senderIdInt);
    if (receiverIdsInt.length === 0) return res.status(400).json({ message: 'No valid recipients', success: false, code: 'NO_VALID_RECIPIENTS' });
    if (receiverIdsInt.length > 1000) return res.status(400).json({ message: 'Too many recipients (max 1000)', success: false, code: 'TOO_MANY_RECIPIENTS' });

    const { data: receivers } = await supabase.from('users').select('id, name, status').in('id', receiverIdsInt);
    const activeReceivers = (receivers || []).filter(r => r.status === 'active');
    if (activeReceivers.length === 0) return res.status(400).json({ message: 'No active recipients found', success: false, code: 'NO_ACTIVE_RECIPIENTS' });

    const { data: newMsg, error } = await supabase.from('messages')
      .insert({ sender_id: senderIdInt, subject: subject.trim(), message: message.trim(), message_type: messageType, is_read: false, is_group: true })
      .select('id').single();
    if (error) throw error;

    const activeIds = activeReceivers.map(r => r.id);
    await supabase.from('message_recipients').insert(activeIds.map(id => ({ message_id: newMsg.id, user_id: id, is_read: false })));

    const { data: sender } = await supabase.from('users').select('name').eq('id', senderIdInt).single();
    await supabase.from('notifications').insert(activeIds.map(id => ({ user_id: id, title: `New group message from ${sender.name}`, message: subject.trim(), type: 'info', is_read: false, link: `/messages/${newMsg.id}` })));

    res.json({ id: newMsg.id, message: `Group message sent to ${activeIds.length} recipients`, count: activeIds.length, success: true });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message', error: error.message, success: false, code: 'SEND_ERROR' });
  }
});

// Mark message as read
router.put('/read/:messageId', verifyUser, async (req, res) => {
  try {
    const messageIdInt = parseInt(req.params.messageId);
    const { data: msg } = await supabase.from('messages').select('receiver_id, is_group').eq('id', messageIdInt).single();
    if (!msg) return res.status(404).json({ message: 'Message not found', success: false });
    if (!msg.is_group && msg.receiver_id !== req.userId) return res.status(403).json({ message: 'Forbidden', success: false });

    if (!msg.is_group) {
      await supabase.from('messages').update({ is_read: true }).eq('id', messageIdInt);
    } else {
      await supabase.from('message_recipients').update({ is_read: true, read_at: new Date().toISOString() }).eq('message_id', messageIdInt).eq('user_id', req.userId);
    }

    res.json({ message: 'Message marked as read', success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark all messages as read
router.put('/read-all/:userId', verifyUser, async (req, res) => {
  try {
    const userIdInt = parseInt(req.params.userId);
    if (req.userId !== userIdInt) return res.status(403).json({ message: 'Forbidden', success: false });
    await supabase.from('messages').update({ is_read: true }).eq('receiver_id', userIdInt);
    res.json({ message: 'All messages marked as read', success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete message
router.delete('/:messageId', verifyUser, async (req, res) => {
  try {
    const messageIdInt = parseInt(req.params.messageId);
    if (isNaN(messageIdInt)) return res.status(400).json({ message: 'Invalid message ID', success: false, code: 'INVALID_MESSAGE_ID' });

    const { data: msg } = await supabase.from('messages').select('sender_id, users!sender_id(role)').eq('id', messageIdInt).single();
    if (!msg) return res.status(404).json({ message: 'Message not found', success: false, code: 'MESSAGE_NOT_FOUND' });

    const senderRole = msg.users?.role;
    const canDelete = req.userRole === 'system_admin' || msg.sender_id === req.userId || ['system_admin', 'property_admin'].includes(senderRole);
    if (!canDelete) return res.status(403).json({ message: 'You do not have permission to delete this message', success: false, code: 'DELETE_NOT_PERMITTED' });

    await supabase.from('message_recipients').delete().eq('message_id', messageIdInt);
    await supabase.from('messages').delete().eq('id', messageIdInt);

    res.json({ message: 'Message deleted successfully', id: messageIdInt, success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false, code: 'DELETE_ERROR' });
  }
});

// Edit message
router.put('/:messageId', verifyUser, async (req, res) => {
  try {
    const messageIdInt = parseInt(req.params.messageId);
    const { subject, message } = req.body;

    if (isNaN(messageIdInt)) return res.status(400).json({ message: 'Invalid message ID', success: false, code: 'INVALID_MESSAGE_ID' });
    if (!subject?.trim()) return res.status(400).json({ message: 'Subject is required', success: false, code: 'SUBJECT_REQUIRED' });
    if (!message?.trim()) return res.status(400).json({ message: 'Message content is required', success: false, code: 'MESSAGE_REQUIRED' });
    if (subject.length > 255) return res.status(400).json({ message: 'Subject too long', success: false, code: 'SUBJECT_TOO_LONG' });
    if (message.length > 5000) return res.status(400).json({ message: 'Message too long', success: false, code: 'MESSAGE_TOO_LONG' });

    const { data: msg } = await supabase.from('messages').select('sender_id, created_at').eq('id', messageIdInt).single();
    if (!msg) return res.status(404).json({ message: 'Message not found', success: false, code: 'MESSAGE_NOT_FOUND' });
    if (msg.sender_id !== req.userId && req.userRole !== 'system_admin') return res.status(403).json({ message: 'Only message sender or system admin can edit', success: false, code: 'EDIT_NOT_PERMITTED' });

    const messageAge = Date.now() - new Date(msg.created_at).getTime();
    if (messageAge > 24 * 60 * 60 * 1000 && req.userRole !== 'system_admin') {
      return res.status(403).json({ message: 'Message is too old to edit (24 hour limit)', success: false, code: 'MESSAGE_TOO_OLD' });
    }

    const now = new Date().toISOString();
    await supabase.from('messages').update({ subject: subject.trim(), message: message.trim(), updated_at: now }).eq('id', messageIdInt);

    res.json({ message: 'Message updated successfully', id: messageIdInt, updated_at: now, success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false, code: 'UPDATE_ERROR' });
  }
});

// Bulk send (admin)
router.post('/bulk', verifyUser, checkSendPermission, async (req, res) => {
  try {
    const { receiver_ids, subject, message, message_type, filter_role } = req.body;
    const senderIdInt = req.userId;

    if (!subject || !message) return res.status(400).json({ message: 'Subject and message are required', success: false });
    if (!['admin', 'system_admin', 'property_admin'].includes(req.userRole)) return res.status(403).json({ message: 'Only admins can send bulk messages', success: false });

    let receiverIdsInt = [];

    if (Array.isArray(receiver_ids) && receiver_ids.length > 0) {
      receiverIdsInt = receiver_ids.map(id => parseInt(id)).filter(id => !isNaN(id) && id !== senderIdInt);
    } else if (filter_role) {
      let q = supabase.from('users').select('id').eq('status', 'active').neq('id', senderIdInt);
      if (filter_role !== 'all') q = q.eq('role', filter_role);
      const { data } = await q;
      receiverIdsInt = (data || []).map(u => u.id);
    }

    if (receiverIdsInt.length === 0) return res.status(400).json({ message: 'No valid recipients', success: false });

    const { data: newMsg, error } = await supabase.from('messages')
      .insert({ sender_id: senderIdInt, subject, message, message_type: message_type || 'general', is_read: false, is_group: true })
      .select('id').single();
    if (error) throw error;

    await supabase.from('message_recipients').insert(receiverIdsInt.map(id => ({ message_id: newMsg.id, user_id: id })));

    const { data: sender } = await supabase.from('users').select('name').eq('id', senderIdInt).single();
    await supabase.from('notifications').insert(receiverIdsInt.map(id => ({ user_id: id, title: `New message from ${sender.name}`, message: subject, type: 'info', link: `/messages/${newMsg.id}` })));

    res.json({ id: newMsg.id, message: `Message sent to ${receiverIdsInt.length} recipients`, count: receiverIdsInt.length, success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send messages', error: error.message, success: false });
  }
});

// Get message thread
router.get('/:messageId/thread', verifyUser, async (req, res) => {
  try {
    const messageIdInt = parseInt(req.params.messageId);
    if (isNaN(messageIdInt)) return res.status(400).json({ message: 'Invalid message ID', success: false });

    const { data: mainMessage } = await supabase.from('messages')
      .select('*, sender:users!sender_id(name, role), receiver:users!receiver_id(name)')
      .eq('id', messageIdInt).single();
    if (!mainMessage) return res.status(404).json({ message: 'Message not found', success: false });

    const { data: replies } = await supabase.from('messages')
      .select('*, sender:users!sender_id(name, role)')
      .eq('parent_id', messageIdInt).order('created_at');

    res.json({ main_message: mainMessage, replies: replies || [], reply_count: replies?.length || 0, success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Get replies
router.get('/:messageId/replies', verifyUser, async (req, res) => {
  try {
    const messageIdInt = parseInt(req.params.messageId);
    if (isNaN(messageIdInt)) return res.status(400).json({ message: 'Invalid message ID', success: false });

    const { data: replies } = await supabase.from('messages')
      .select('*, sender:users!sender_id(name, role)')
      .eq('parent_id', messageIdInt).order('created_at');

    res.json({ replies: replies || [], count: replies?.length || 0, success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Send reply
router.post('/:messageId/reply', verifyUser, checkSendPermission, async (req, res) => {
  try {
    const messageIdInt = parseInt(req.params.messageId);
    const { subject, message } = req.body;
    const senderIdInt = req.userId;

    if (isNaN(messageIdInt)) return res.status(400).json({ message: 'Invalid message ID', success: false });
    if (!subject?.trim()) return res.status(400).json({ message: 'Subject is required', success: false });
    if (!message?.trim()) return res.status(400).json({ message: 'Message content is required', success: false });

    const { data: originalMsg } = await supabase.from('messages').select('sender_id, receiver_id').eq('id', messageIdInt).single();
    if (!originalMsg) return res.status(404).json({ message: 'Original message not found', success: false });

    const receiverId = originalMsg.sender_id === senderIdInt ? originalMsg.receiver_id : originalMsg.sender_id;
    if (!receiverId) return res.status(400).json({ message: 'Cannot determine reply recipient', success: false });

    const { data: newMsg, error } = await supabase.from('messages')
      .insert({ sender_id: senderIdInt, receiver_id: receiverId, subject: subject.trim(), message: message.trim(), message_type: 'general', is_read: false, is_group: false, parent_id: messageIdInt })
      .select('id').single();
    if (error) throw error;

    // Increment reply_count via rpc or just skip — handled by DB trigger if set up
    await supabase.rpc('increment_reply_count', { msg_id: messageIdInt }).catch(() => {});

    const { data: sender } = await supabase.from('users').select('name').eq('id', senderIdInt).single();
    await supabase.from('notifications').insert({ user_id: receiverId, title: `New reply from ${sender.name}`, message: subject.trim(), type: 'info', is_read: false, link: `/messages/${newMsg.id}` });

    res.json({ id: newMsg.id, message: 'Reply sent successfully', parent_id: messageIdInt, success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send reply', error: error.message, success: false });
  }
});

module.exports = router;
