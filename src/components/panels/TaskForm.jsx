import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HudButton from '../shared/HudButton';
import { HudInput, HudTextarea, HudSelect } from '../shared/HudInput';
import { PRIORITY_COLORS } from '../../utils/constants';

const PRIORITIES = [
  { key: 'high', label: 'HIGH', color: PRIORITY_COLORS.high },
  { key: 'medium', label: 'MED', color: PRIORITY_COLORS.medium },
  { key: 'low', label: 'LOW', color: PRIORITY_COLORS.low },
];

const RECURRENCE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 28 },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 30,
    transition: { duration: 0.2 },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: 'easeOut' },
  }),
};

function PriorityButton({ color, label, selected, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.04, backgroundColor: `${color}18` }}
      whileTap={{ scale: 0.96 }}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '10px 12px',
        background: selected ? `${color}15` : 'rgba(255, 255, 255, 0.03)',
        border: `1.5px solid ${selected ? color : 'var(--border-hud)'}`,
        borderRadius: '4px',
        cursor: 'pointer',
        outline: 'none',
        transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
        boxShadow: selected ? `0 0 12px ${color}25, inset 0 0 12px ${color}08` : 'none',
      }}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: color,
          boxShadow: selected ? `0 0 6px ${color}` : 'none',
          transition: 'box-shadow 0.2s',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '10px',
          letterSpacing: '0.1em',
          color: selected ? color : 'var(--hud-white-dim)',
          textTransform: 'uppercase',
          transition: 'color 0.2s',
        }}
      >
        {label}
      </span>
    </motion.button>
  );
}

const emptyForm = {
  title: '',
  description: '',
  due_date: '',
  due_time: '',
  priority: 'medium',
  recurrence: '',
  tags: '',
};

export default function TaskForm({ isOpen, onClose, onSubmit, editTask }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (editTask) {
      setForm({
        title: editTask.title || '',
        description: editTask.description || '',
        due_date: editTask.due_date || '',
        due_time: editTask.due_time || '',
        priority: editTask.priority || 'medium',
        recurrence: editTask.recurrence || '',
        tags: Array.isArray(editTask.tags) ? editTask.tags.join(', ') : editTask.tags || '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [editTask, isOpen]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handlePriority = (priority) => {
    setForm((prev) => ({ ...prev, priority }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const payload = {
      ...form,
      tags: form.tags
        ? form.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    };
    onSubmit(payload);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.form
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            style={{
              width: '420px',
              maxHeight: '85vh',
              overflowY: 'auto',
              background: 'var(--bg-panel)',
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(79, 195, 247, 0.015) 3px, rgba(79, 195, 247, 0.015) 4px)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid var(--border-hud-bright)',
              borderRadius: '6px',
              padding: '24px',
              boxShadow: '0 0 40px rgba(79, 195, 247, 0.15)',
            }}
          >
            {/* Header */}
            <div
              style={{
                width: '40px',
                height: '3px',
                background: 'linear-gradient(90deg, var(--hud-cyan), transparent)',
                borderRadius: '2px',
                marginBottom: '10px',
                boxShadow: '0 0 8px rgba(0, 229, 255, 0.3)',
              }}
            />
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '13px',
                fontVariant: 'small-caps',
                letterSpacing: '0.15em',
                color: 'var(--hud-cyan)',
                textTransform: 'uppercase',
                margin: '0 0 20px 0',
                textShadow: '0 0 8px rgba(0, 229, 255, 0.3)',
              }}
            >
              {editTask ? 'Edit Mission' : 'New Mission'}
            </h2>

            {/* Title */}
            <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
              <HudInput
                label="Title *"
                value={form.title}
                onChange={handleChange('title')}
                required
                autoFocus
                style={{ marginBottom: '18px' }}
              />
            </motion.div>

            {/* Description */}
            <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
              <HudTextarea
                label="Description"
                value={form.description}
                onChange={handleChange('description')}
                rows={2}
                style={{ marginBottom: '18px' }}
              />
            </motion.div>

            {/* Date & Time row */}
            <motion.div
              custom={2}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              style={{ display: 'flex', gap: '12px', marginBottom: '18px' }}
            >
              <HudInput
                label="Due Date"
                type="date"
                value={form.due_date}
                onChange={handleChange('due_date')}
                style={{ flex: 1 }}
              />
              <HudInput
                label="Due Time"
                type="time"
                value={form.due_time}
                onChange={handleChange('due_time')}
                style={{ flex: 1 }}
              />
            </motion.div>

            {/* Priority selector */}
            <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible">
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '9px',
                  letterSpacing: '0.1em',
                  color: 'var(--hud-white-dim)',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Priority
              </span>
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '18px',
                }}
              >
                {PRIORITIES.map((p) => (
                  <PriorityButton
                    key={p.key}
                    color={p.color}
                    label={p.label}
                    selected={form.priority === p.key}
                    onClick={() => handlePriority(p.key)}
                  />
                ))}
              </div>
            </motion.div>

            {/* Recurrence */}
            <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible">
              <HudSelect
                label="Recurrence"
                value={form.recurrence}
                onChange={handleChange('recurrence')}
                style={{ marginBottom: '18px' }}
              >
                {RECURRENCE_OPTIONS.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    style={{ background: '#0d1117', color: '#E0F7FA' }}
                  >
                    {opt.label}
                  </option>
                ))}
              </HudSelect>
            </motion.div>

            {/* Tags */}
            <motion.div custom={5} variants={fieldVariants} initial="hidden" animate="visible">
              <HudInput
                label="Tags (comma separated)"
                value={form.tags}
                onChange={handleChange('tags')}
                style={{ marginBottom: '24px' }}
              />
            </motion.div>

            {/* Actions */}
            <motion.div
              custom={6}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}
            >
              <HudButton variant="ghost" size="md" onClick={onClose} type="button">
                Abort
              </HudButton>
              <HudButton variant="primary" size="md" type="submit" disabled={!form.title.trim()}>
                Execute
              </HudButton>
            </motion.div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
