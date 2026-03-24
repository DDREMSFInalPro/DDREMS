import { useState, useEffect } from 'react';
import { agreementAPI } from '../services/api';

const AgreementManagementPage = () => {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ status: '', page: 1 });
  const [generating, setGenerating] = useState(null);
  const [forwarding, setForwarding] = useState(null);
  const [sendingCounter, setSendingCounter] = useState(null);
  const [noteModal, setNoteModal] = useState(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => { fetchAgreements(); }, [filters.page, filters.status]);

  const fetchAgreements = async () => {
    setLoading(true);
    try {
      const params = { page: filters.page, limit: 20 };
      if (filters.status) params.status = filters.status;
      const res = await agreementAPI.getAll(params);
      setAgreements(res.data.data.agreements);
      setPagination(res.data.data.pagination);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleGeneratePDF = async (id) => {
    setGenerating(id);
    try {
      const res = await agreementAPI.generatePDF(id);
      setAgreements(agreements.map((a) => a.id === id ? { ...a, pdfUrl: res.data.data.pdfUrl, status: res.data.data.status } : a));
      alert('PDF generated and agreement completed!');
    } catch (err) { alert(err.response?.data?.message || 'Failed to generate PDF.'); }
    finally { setGenerating(null); }
  };

  const handleForwardToOwner = async (id) => {
    if (!window.confirm('Forward this agreement request to the property owner for review?')) return;
    setForwarding(id);
    try {
      const res = await agreementAPI.forwardToOwner(id, {});
      setAgreements(agreements.map((a) => a.id === id ? { ...a, status: 'forwarded_to_owner' } : a));
      alert('Agreement forwarded to owner for review!');
    } catch (err) { alert(err.response?.data?.message || 'Failed to forward.'); }
    finally { setForwarding(null); }
  };

  const handleSendCounterOffer = async (id) => {
    if (!window.confirm('Send this counter-offer to the buyer for review?')) return;
    setSendingCounter(id);
    try {
      await agreementAPI.sendCounterOfferToBuyer(id, {});
      setAgreements(agreements.map((a) => a.id === id ? { ...a, status: 'counter_offer_sent' } : a));
      alert('Counter-offer sent to the buyer!');
    } catch (err) { alert(err.response?.data?.message || 'Failed to send counter-offer.'); }
    finally { setSendingCounter(null); }
  };

  const handleSaveNote = async () => {
    if (!noteModal) return;
    try {
      await agreementAPI.addNote(noteModal, { adminNote: noteText });
      setAgreements(agreements.map((a) => a.id === noteModal ? { ...a, adminNote: noteText } : a));
      setNoteModal(null); setNoteText('');
    } catch (err) { alert('Failed to save note.'); }
  };

  const statusBadge = (status) => {
    const map = { pending: 'badge--warning', forwarded_to_owner: 'badge--info', counter_offer: 'badge--purple', counter_offer_sent: 'badge--purple', owner_approved: 'badge--success', owner_rejected: 'badge--danger', completed: 'badge--info' };
    return `badge ${map[status] || 'badge--default'}`;
  };

  return (
    <div className="agreements-page">
      <div className="page-header"><h1>Agreement Management</h1><p>Manage all agreement requests across the system</p></div>

      <div className="toolbar">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })} id="select-agreement-status">
          <option value="">All Statuses</option>
          <option value="pending">Pending (New)</option>
          <option value="forwarded_to_owner">Forwarded to Owner</option>
          <option value="counter_offer">Counter-Offer (Pending Review)</option>
          <option value="counter_offer_sent">Counter-Offer Sent</option>
          <option value="owner_approved">Owner Approved</option>
          <option value="owner_rejected">Owner Rejected</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? <div className="loading-screen"><div className="spinner"></div></div> : agreements.length === 0 ? <div className="empty-state"><h3>No agreements found</h3></div> : (
        <>
          <div className="table-responsive"><table className="table"><thead><tr><th>Property</th><th>Buyer</th><th>Owner</th><th>Type</th><th>Status</th><th>PDF</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>{agreements.map((a) => (
              <tr key={a.id}>
                <td><strong>{a.property?.title || 'N/A'}</strong><br /><small>{a.property?.address}</small></td>
                <td>{a.buyer?.name}<br /><small>{a.buyer?.email}</small></td>
                <td>{a.owner?.name}<br /><small>{a.owner?.email}</small></td>
                <td className="capitalize">{a.agreementType}</td>
                <td><span className={statusBadge(a.status)}>{a.status === 'forwarded_to_owner' ? 'Forwarded' : a.status === 'counter_offer' ? 'Counter-Offer ✉' : a.status === 'counter_offer_sent' ? 'Counter Sent ✓' : a.status.replace('owner_', '')}</span></td>
                <td>{a.pdfUrl ? <a href={a.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn--sm btn--outline">📥 Download</a> : a.counterOfferPrice ? <span style={{color:'#e67e22'}}>💰 ETB {Number(a.counterOfferPrice).toLocaleString()}{a.ownerNotes ? ` — ${a.ownerNotes}` : ''}</span> : <span className="text-muted">—</span>}</td>
                <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    {a.status === 'pending' && (
                      <button className="btn btn--sm btn--primary" onClick={() => handleForwardToOwner(a.id)} disabled={forwarding === a.id}>
                        {forwarding === a.id ? '⏳' : '📨'} Forward to Owner
                      </button>
                    )}
                    {a.status === 'counter_offer' && (
                      <button className="btn btn--sm btn--warning" onClick={() => handleSendCounterOffer(a.id)} disabled={sendingCounter === a.id}>
                        {sendingCounter === a.id ? '⏳' : '📨'} Send to Buyer
                      </button>
                    )}
                    {a.status === 'owner_approved' && !a.pdfUrl && (
                      <button className="btn btn--sm btn--primary" onClick={() => handleGeneratePDF(a.id)} disabled={generating === a.id}>
                        {generating === a.id ? '⏳' : '📄'} Generate PDF
                      </button>
                    )}
                    <button className="btn btn--sm btn--outline" onClick={() => { setNoteModal(a.id); setNoteText(a.adminNote || ''); }}>📝 Note</button>
                  </div>
                </td>
              </tr>
            ))}</tbody></table></div>
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn--outline" disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Previous</button>
              <span className="pagination__info">Page {pagination.page} of {pagination.totalPages}</span>
              <button className="btn btn--outline" disabled={filters.page >= pagination.totalPages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</button>
            </div>
          )}
        </>
      )}

      {/* Admin Note Modal */}
      {noteModal && (
        <div className="modal-overlay" onClick={() => setNoteModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header"><h2>Admin Note</h2><button className="modal__close" onClick={() => setNoteModal(null)}>✕</button></div>
            <div className="modal__body">
              <div className="form-group"><label>Note</label><textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={4} placeholder="Add admin note..." /></div>
              <div className="modal__footer">
                <button className="btn btn--outline" onClick={() => setNoteModal(null)}>Cancel</button>
                <button className="btn btn--primary" onClick={handleSaveNote}>Save Note</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgreementManagementPage;
