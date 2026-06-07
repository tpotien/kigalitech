export default function DeliverySlotPicker({ value, onChange }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    return d;
  });

  const slots = [
    { id: 'morning',   label: 'Morning',   time: '8am – 12pm',  icon: '🌅' },
    { id: 'afternoon', label: 'Afternoon', time: '12pm – 5pm',  icon: '☀️' },
    { id: 'evening',   label: 'Evening',   time: '5pm – 8pm',   icon: '🌆' },
  ];

  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const selectedDate = value?.date || '';
  const selectedSlot = value?.slot || '';

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">📅 Preferred Delivery Date <span className="text-slate-400 font-normal">(optional)</span></p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map(d => {
          const full = d.toISOString().split('T')[0];
          const isSelected = selectedDate === full;
          return (
            <button key={full} type="button" onClick={() => onChange({ date: full, slot: selectedSlot })}
              className={`flex-shrink-0 flex flex-col items-center rounded-xl border-2 px-3 py-2 min-w-[52px] transition-all ${isSelected ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30' : 'border-slate-200 dark:border-slate-700 hover:border-sky-300'}`}>
              <span className={`text-xs font-medium ${isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`}>{DAY_NAMES[d.getDay()]}</span>
              <span className={`text-lg font-extrabold ${isSelected ? 'text-sky-700 dark:text-sky-300' : 'text-slate-700 dark:text-slate-200'}`}>{d.getDate()}</span>
              <span className={`text-xs ${isSelected ? 'text-sky-500' : 'text-slate-400'}`}>{MONTH_NAMES[d.getMonth()]}</span>
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="grid grid-cols-3 gap-2">
          {slots.map(s => {
            const isSelected = selectedSlot === s.id;
            return (
              <button key={s.id} type="button" onClick={() => onChange({ date: selectedDate, slot: s.id })}
                className={`flex flex-col items-center rounded-xl border-2 p-3 transition-all ${isSelected ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30' : 'border-slate-200 dark:border-slate-700 hover:border-sky-300'}`}>
                <span className="text-xl mb-1">{s.icon}</span>
                <span className={`text-xs font-bold ${isSelected ? 'text-sky-700 dark:text-sky-300' : 'text-slate-700 dark:text-slate-200'}`}>{s.label}</span>
                <span className="text-xs text-slate-400 text-center mt-0.5">{s.time}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
