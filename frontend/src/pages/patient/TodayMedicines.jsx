import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { CheckCircle2, Circle, X, AlertTriangle, Pill, ChevronDown, ChevronUp, StopCircle, Heart } from 'lucide-react';

// ── Motivational messages shown after marking a dose ──────────────────────
const MOTIVATIONAL = [
  { emoji: '💚', msg: "Great job! You're one step closer to feeling better.", sub: "Keep it up — every dose counts!" },
  { emoji: '🌟', msg: "Well done! You're healing beautifully.", sub: "Stay consistent and you'll feel great soon!" },
  { emoji: '💪', msg: "That's the spirit! Your body is working hard for you.", sub: "You're doing amazing. Keep going!" },
  { emoji: '🌸', msg: "Don't worry — everything will be alright soon.", sub: "Taking your medicine is the best thing you can do right now." },
  { emoji: '☀️', msg: "Wonderful! Every dose brings you closer to health.", sub: "You've got this. Brighter days ahead!" },
  { emoji: '🌿', msg: "Your healing journey is on track!", sub: "Small steps every day lead to big recovery." },
  { emoji: '🦋', msg: "You're doing brilliantly — keep it up!", sub: "Health is wealth, and you're investing in yourself." },
  { emoji: '✨', msg: "Stay strong — you're getting better each day!", sub: "Your consistency is your superpower." },
  { emoji: '🌈', msg: "Proud of you! Dose taken, healing activated.", sub: "Rest well, eat well, and trust the process." },
  { emoji: '❤️', msg: "Your health matters — and so do you!", sub: "We're cheering for your speedy recovery." },
];

function MotivationalPopup({ onClose }) {
  const msg = MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)];
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(onClose, 3500);
    return () => clearTimeout(timerRef.current);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
      {/* Backdrop — dim but tappable-through */}
      <div className="absolute inset-0 bg-black/20 pointer-events-auto" onClick={onClose} />

      {/* Card */}
      <div className="relative pointer-events-auto bg-white rounded-3xl shadow-2xl p-7 max-w-xs w-full text-center animate-[bounceIn_0.4s_ease-out]">
        {/* Close */}
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-300 hover:text-gray-500">
          <X className="w-5 h-5" />
        </button>

        {/* Pulsing heart ring */}
        <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-40" />
          <div className="absolute inset-2 rounded-full bg-green-200 opacity-60" />
          <div className="relative w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Emoji */}
        <div className="text-4xl mb-2">{msg.emoji}</div>

        {/* Messages */}
        <h3 className="text-gray-900 font-bold text-base leading-snug mb-1">{msg.msg}</h3>
        <p className="text-gray-500 text-sm">{msg.sub}</p>

        {/* Progress dots (decorative) */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full bg-green-400 ${i === 0 ? 'w-6' : 'w-1.5'}`} />
          ))}
        </div>

        {/* Tap to dismiss hint */}
        <p className="text-xs text-gray-300 mt-3">Tap anywhere to dismiss</p>
      </div>
    </div>
  );
}

const STOP_REASONS = [
  { value: 'course_complete', label: '✅ Course Complete', desc: 'Finished all tablets as prescribed' },
  { value: 'condition_resolved', label: '💪 Condition Resolved', desc: 'Illness/problem is fully healed' },
  { value: 'side_effects', label: '⚠️ Side Effects', desc: 'Experiencing unwanted side effects' },
  { value: 'doctor_advised', label: '👨‍⚕️ Doctor Advised Stop', desc: 'My doctor told me to stop' },
  { value: 'other', label: '📝 Other Reason', desc: 'Another reason' },
];

function StopMedicineModal({ medicine, onClose, onStopped }) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleStop = async () => {
    if (!reason) return toast.error('Please select a reason');
    setSaving(true);
    try {
      await api.post(`/patient/medicines/${medicine.med_id}/stop`, { stop_reason: reason, stop_notes: notes });
      toast.success(`${medicine.medicine_name} stopped`);
      onStopped(medicine.med_id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to stop medicine');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-red-50 border-b border-red-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StopCircle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-red-800">Stop Medicine</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="font-semibold text-gray-800">{medicine.medicine_name}</p>
            <p className="text-sm text-gray-500">{medicine.dosage} · {medicine.frequency}</p>
            {medicine.diagnosis && <p className="text-xs text-gray-400 mt-0.5">For: {medicine.diagnosis}</p>}
          </div>

          <p className="text-sm font-medium text-gray-700 mb-2">Why are you stopping this medicine?</p>
          <div className="space-y-2 mb-4">
            {STOP_REASONS.map(r => (
              <button key={r.value} type="button"
                onClick={() => setReason(r.value)}
                className={`w-full text-left p-3 rounded-xl border-2 transition-colors ${
                  reason === r.value
                    ? 'border-red-400 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                <p className="text-sm font-medium text-gray-800">{r.label}</p>
                <p className="text-xs text-gray-500">{r.desc}</p>
              </button>
            ))}
          </div>

          <div className="mb-4">
            <label className="text-xs font-medium text-gray-600 block mb-1">Additional notes (optional)</label>
            <textarea className="input text-sm" rows={2}
              placeholder="Any extra details..."
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
            <button onClick={handleStop} disabled={!reason || saving}
              className="flex-1 text-sm bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-medium py-2 px-4 rounded-lg transition-colors">
              {saving ? 'Stopping...' : 'Stop Medicine'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MedicineCard({ med, onLogDose, onUnlog, onStop, onShowMotivation }) {
  const [open, setOpen] = useState(true);
  const [logging, setLogging] = useState(null);

  const handleLog = async (slot, alreadyTaken) => {
    setLogging(slot);
    try {
      if (alreadyTaken) {
        await api.delete(`/patient/medicines/${med.med_id}/log`, { data: { dose_slot: slot } });
        onUnlog(med.med_id, slot);
        toast.success('Dose unmarked');
      } else {
        await api.post(`/patient/medicines/${med.med_id}/log`, { dose_slot: slot });
        onLogDose(med.med_id, slot);
        onShowMotivation(); // 🎉 show motivational popup
      }
    } catch {
      toast.error('Failed to update dose');
    } finally {
      setLogging(null);
    }
  };

  const pendingCount = med.slots.filter(s => !s.taken).length;
  const allDone = pendingCount === 0;

  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-colors ${
      allDone ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white'
    }`}>
      {/* Header */}
      <div className="p-4 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              allDone ? 'bg-green-100' : 'bg-brand-50'
            }`}>
              {allDone
                ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                : <Pill className="w-5 h-5 text-brand-600" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-900 truncate">{med.medicine_name}</p>
                <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                  {med.dosage}
                </span>
                {allDone && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    All done today ✓
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{med.frequency}</p>
              {!allDone && (
                <p className="text-xs text-amber-600 font-medium mt-0.5">
                  {pendingCount} dose{pendingCount > 1 ? 's' : ''} remaining today
                </p>
              )}
            </div>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
        </div>
      </div>

      {/* Expanded */}
      {open && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          {/* Prescription info */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="font-mono font-semibold text-brand-600">{med.prescription_code}</span>
            {med.diagnosis && <><span>·</span><span>Dx: {med.diagnosis}</span></>}
            <span>·</span><span>Dr. {med.doctor_name}</span>
          </div>

          {/* Instructions */}
          {med.instructions && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-800">
              📋 {med.instructions}
            </div>
          )}

          {/* Dose slots */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Today's doses</p>
            {med.slots.map(s => (
              <button key={s.slot} type="button"
                onClick={() => handleLog(s.slot, s.taken)}
                disabled={logging === s.slot}
                className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                  s.taken
                    ? 'border-green-300 bg-green-50 text-green-800'
                    : 'border-gray-200 bg-white hover:border-brand-300 text-gray-700'
                }`}>
                <div className="flex items-center gap-2.5">
                  {s.taken
                    ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    : <Circle className="w-5 h-5 text-gray-300 shrink-0" />}
                  <div className="text-left">
                    <p className="text-sm font-medium">{s.slot}</p>
                    {s.taken && s.taken_at && (
                      <p className="text-xs opacity-70">
                        Taken at {format(new Date(s.taken_at), 'hh:mm aa')}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  s.taken ? 'bg-green-200 text-green-800' : 'bg-gray-100 text-gray-500'
                }`}>
                  {logging === s.slot ? '...' : s.taken ? 'Taken ✓' : 'Tap to mark'}
                </span>
              </button>
            ))}
          </div>

          {/* Stop medicine */}
          <div className="pt-1 border-t border-gray-100">
            <button type="button" onClick={() => onStop(med)}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium py-1">
              <StopCircle className="w-3.5 h-3.5" />
              Stop this medicine (course complete / problem resolved)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TodayMedicines() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stopTarget, setStopTarget] = useState(null);
  const [showMotivation, setShowMotivation] = useState(false);
  const today = new Date();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/patient/medicines/today');
      setSchedule(data.data.medicines);
    } catch {
      // No active dispensed prescriptions — that's fine, not an error
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLogDose = (medId, slot) => {
    setSchedule(prev => prev.map(m => m.med_id !== medId ? m : {
      ...m,
      slots: m.slots.map(s => s.slot !== slot ? s : { ...s, taken: true, taken_at: new Date().toISOString() }),
      pending_count: m.pending_count - 1,
      all_taken: m.slots.filter(s => s.slot !== slot && !s.taken).length === 0,
    }));
  };

  const handleUnlog = (medId, slot) => {
    setSchedule(prev => prev.map(m => m.med_id !== medId ? m : {
      ...m,
      slots: m.slots.map(s => s.slot !== slot ? s : { ...s, taken: false, taken_at: null }),
      pending_count: m.pending_count + 1,
      all_taken: false,
    }));
  };

  const handleStopped = (medId) => {
    setSchedule(prev => prev.filter(m => m.med_id !== medId));
  };

  const totalPending = schedule.reduce((a, m) => a + m.slots.filter(s => !s.taken).length, 0);
  const totalDone = schedule.reduce((a, m) => a + m.slots.filter(s => s.taken).length, 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Pill className="w-8 h-8 text-brand-300 animate-pulse" />
      <p className="text-gray-400 text-sm">Loading today's medicines...</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Motivational popup */}
      {showMotivation && <MotivationalPopup onClose={() => setShowMotivation(false)} />}

      {/* Stop modal */}
      {stopTarget && (
        <StopMedicineModal
          medicine={stopTarget}
          onClose={() => setStopTarget(null)}
          onStopped={handleStopped}
        />
      )}

      {/* Header card */}
      <div className="card p-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-brand-100 text-xs font-medium uppercase tracking-wide">
              {format(today, 'EEEE, dd MMM yyyy')}
            </p>
            <h2 className="text-lg font-bold mt-0.5">💊 Today's Medicines</h2>
            {schedule.length === 0 ? (
              <p className="text-brand-200 text-sm mt-1">No active medicines today</p>
            ) : totalPending === 0 ? (
              <p className="text-brand-200 text-sm mt-1">🎉 All doses taken today!</p>
            ) : (
              <p className="text-brand-200 text-sm mt-1">
                {totalPending} dose{totalPending !== 1 ? 's' : ''} remaining · {totalDone} done
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-2xl font-bold">
                {schedule.length === 0 ? '—' : totalPending === 0 ? '✓' : totalPending}
              </span>
            </div>
            {schedule.length > 0 && totalPending > 0 && (
              <p className="text-xs text-brand-200 mt-1">pending</p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {schedule.length > 0 && (totalPending + totalDone) > 0 && (
          <div className="mt-3">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${(totalDone / (totalPending + totalDone)) * 100}%` }}
              />
            </div>
            <p className="text-xs text-brand-200 mt-1">{Math.round((totalDone / (totalPending + totalDone)) * 100)}% complete today</p>
          </div>
        )}
      </div>

      {/* Reminder info */}
      {schedule.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span>
            Tap <strong>each dose time</strong> to mark it taken. A reminder notification is sent to your portal daily.
            If you finish the course or your problem is resolved, tap <strong>"Stop this medicine"</strong>.
          </span>
        </div>
      )}

      {/* Medicine cards */}
      {schedule.length === 0 ? (
        <div className="card p-8 text-center">
          <Pill className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No active medicines today</p>
          <p className="text-gray-400 text-sm mt-1">
            Medicines appear here once your prescription is dispensed by a pharmacy.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedule.map(med => (
            <MedicineCard
              key={med.med_id}
              med={med}
              onLogDose={handleLogDose}
              onUnlog={handleUnlog}
              onStop={setStopTarget}
              onShowMotivation={() => setShowMotivation(true)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
