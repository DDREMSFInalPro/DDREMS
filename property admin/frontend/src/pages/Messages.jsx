import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Grid, List, ListItem, ListItemButton, ListItemText,
  ListItemAvatar, Avatar, TextField, IconButton, Paper, Chip, Badge,
  Divider, InputAdornment, Alert,
} from '@mui/material';
import {
  Send, Search, Person, AttachFile, MoreVert, CheckCircle,
  Schedule, ErrorOutline,
} from '@mui/icons-material';

// Mock conversations
const MOCK_CONVERSATIONS = [
  {
    id: 'c1',
    propertyId: 'p1',
    propertyTitle: 'Modern Villa in Kezira',
    owner: { name: 'Abebe Girma', email: 'abebe@example.com', avatar: 'A' },
    lastMessage: 'Thank you for the update. I will submit the missing documents tomorrow.',
    lastMessageTime: '2026-03-20T14:30:00Z',
    unread: 2,
    status: 'PENDING',
  },
  {
    id: 'c2',
    propertyId: 'p2',
    propertyTitle: 'Commercial Space - Sabian Market',
    owner: { name: 'Fatuma Hassan', email: 'fatuma@example.com', avatar: 'F' },
    lastMessage: 'I have uploaded the tax clearance certificate.',
    lastMessageTime: '2026-03-20T10:15:00Z',
    unread: 0,
    status: 'IN_REVIEW',
  },
  {
    id: 'c3',
    propertyId: 'p8',
    propertyTitle: 'Family Home - Ashewa',
    owner: { name: 'Tigist Worku', email: 'tigist@example.com', avatar: 'T' },
    lastMessage: 'Can you please explain why my title deed was rejected?',
    lastMessageTime: '2026-03-19T16:45:00Z',
    unread: 1,
    status: 'REJECTED',
  },
  {
    id: 'c4',
    propertyId: 'p5',
    propertyTitle: 'Industrial Warehouse - Melka Jebdu',
    owner: { name: 'Yonas Bekele', email: 'yonas@example.com', avatar: 'Y' },
    lastMessage: 'Property verified successfully!',
    lastMessageTime: '2026-03-18T09:00:00Z',
    unread: 0,
    status: 'VERIFIED',
  },
];

const MOCK_MESSAGES = {
  c1: [
    { id: 'm1', sender: 'admin', text: 'Hello Abebe, we have reviewed your property submission. We need the building permit document to proceed.', timestamp: '2026-03-20T10:00:00Z', status: 'delivered' },
    { id: 'm2', sender: 'owner', text: 'Thank you for letting me know. I will get the building permit from the municipality.', timestamp: '2026-03-20T11:30:00Z', status: 'delivered' },
    { id: 'm3', sender: 'admin', text: 'Great! Please upload it through the portal or bring it to our office.', timestamp: '2026-03-20T12:00:00Z', status: 'delivered' },
    { id: 'm4', sender: 'owner', text: 'Thank you for the update. I will submit the missing documents tomorrow.', timestamp: '2026-03-20T14:30:00Z', status: 'delivered' },
  ],
  c2: [
    { id: 'm5', sender: 'admin', text: 'Hello Fatuma, your business license has been verified. We still need the tax clearance certificate.', timestamp: '2026-03-20T09:00:00Z', status: 'delivered' },
    { id: 'm6', sender: 'owner', text: 'I have uploaded the tax clearance certificate.', timestamp: '2026-03-20T10:15:00Z', status: 'delivered' },
  ],
  c3: [
    { id: 'm7', sender: 'owner', text: 'Can you please explain why my title deed was rejected?', timestamp: '2026-03-19T16:45:00Z', status: 'delivered' },
    { id: 'm8', sender: 'admin', text: 'The document appears to be a photocopy. We require the original or a certified copy from the land registry office.', timestamp: '2026-03-19T17:00:00Z', status: 'delivered' },
  ],
  c4: [
    { id: 'm9', sender: 'admin', text: 'All documents verified. Your property listing is now active!', timestamp: '2026-03-18T09:00:00Z', status: 'delivered' },
  ],
};

const STATUS_CONFIG = {
  PENDING: { color: 'warning', label: 'Pending' },
  IN_REVIEW: { color: 'info', label: 'In Review' },
  VERIFIED: { color: 'success', label: 'Verified' },
  REJECTED: { color: 'error', label: 'Rejected' },
};

const fmtTime = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'Just now';
};

const fmtMessageTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export default function Messages() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (selectedConv) {
      setMessages(MOCK_MESSAGES[selectedConv.id] || []);
    }
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConv) return;

    const msg = {
      id: `m${Date.now()}`,
      sender: 'admin',
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    setMessages((prev) => [...prev, msg]);
    setNewMessage('');

    // Update conversation last message
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConv.id
          ? { ...c, lastMessage: msg.text, lastMessageTime: msg.timestamp, unread: 0 }
          : c
      )
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.owner.name.toLowerCase().includes(search.toLowerCase()) ||
    c.propertyTitle.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Messages</Typography>
          <Typography color="text.secondary">
            Communicate with property owners
            {totalUnread > 0 && ` • ${totalUnread} unread`}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ height: 'calc(100vh - 220px)' }}>
        {/* Conversations List */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search conversations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>

            <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
              {filteredConversations.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="body2">No conversations found</Typography>
                </Box>
              ) : (
                filteredConversations.map((conv) => {
                  const status = STATUS_CONFIG[conv.status];
                  return (
                    <ListItemButton
                      key={conv.id}
                      selected={selectedConv?.id === conv.id}
                      onClick={() => setSelectedConv(conv)}
                      sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '&.Mui-selected': { bgcolor: 'primary.50' },
                      }}
                    >
                      <ListItemAvatar>
                        <Badge badgeContent={conv.unread} color="error">
                          <Avatar sx={{ bgcolor: 'primary.main' }}>{conv.owner.avatar}</Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: '60%' }}>
                              {conv.owner.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {fmtTime(conv.lastMessageTime)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ mb: 0.5 }}>
                              {conv.propertyTitle}
                            </Typography>
                            <Typography variant="body2" noWrap sx={{ mb: 0.5 }}>
                              {conv.lastMessage}
                            </Typography>
                            <Chip label={status.label} color={status.color} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                          </>
                        }
                      />
                    </ListItemButton>
                  );
                })
              )}
            </List>
          </Card>
        </Grid>

        {/* Chat Area */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {!selectedConv ? (
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Person sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} mb={1}>
                    No conversation selected
                  </Typography>
                  <Typography variant="body2">
                    Select a conversation from the list to start messaging
                  </Typography>
                </Box>
              </Box>
            ) : (
              <>
                {/* Chat Header */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>{selectedConv.owner.avatar}</Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {selectedConv.owner.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {selectedConv.propertyTitle}
                      </Typography>
                      <Chip
                        label={STATUS_CONFIG[selectedConv.status].label}
                        color={STATUS_CONFIG[selectedConv.status].color}
                        size="small"
                        sx={{ height: 18, fontSize: '0.65rem', mt: 0.5 }}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" onClick={() => navigate(`/verification/${selectedConv.propertyId}`)}>
                      <MoreVert />
                    </IconButton>
                  </Box>
                </Box>

                {/* Messages */}
                <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>
                  {messages.map((msg) => {
                    const isAdmin = msg.sender === 'admin';
                    return (
                      <Box
                        key={msg.id}
                        sx={{
                          display: 'flex',
                          justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                          mb: 2,
                        }}
                      >
                        <Paper
                          sx={{
                            maxWidth: '70%',
                            p: 1.5,
                            bgcolor: isAdmin ? 'primary.main' : 'white',
                            color: isAdmin ? 'white' : 'text.primary',
                          }}
                        >
                          <Typography variant="body2">{msg.text}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, justifyContent: 'flex-end' }}>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>
                              {fmtMessageTime(msg.timestamp)}
                            </Typography>
                            {isAdmin && (
                              msg.status === 'delivered' ? (
                                <CheckCircle sx={{ fontSize: 12, opacity: 0.7 }} />
                              ) : msg.status === 'sent' ? (
                                <Schedule sx={{ fontSize: 12, opacity: 0.7 }} />
                              ) : (
                                <ErrorOutline sx={{ fontSize: 12, opacity: 0.7 }} />
                              )
                            )}
                          </Box>
                        </Paper>
                      </Box>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Message Input */}
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small">
                      <AttachFile />
                    </IconButton>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      maxRows={3}
                      placeholder="Type a message…"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                    <IconButton
                      color="primary"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                    >
                      <Send />
                    </IconButton>
                  </Box>
                </Box>
              </>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
