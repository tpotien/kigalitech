export default function DeliverySlotPicker({ value, onChange }) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Next 7 days (not including today — today is covered by Now/Same Day)
  const futureDays = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    return d;
  });

  const slots = [
    { id: 'morning',   label: 'Morning',   time: '8am – 12pm',  icon: '🌅' },
    { id: 'afternoon', label: 'Afternoon', time: '12pm – 5pm',  icon: '☀️' },
    { id: 'evening',   label: 'Evening',   time: '5pm – 8pm',   icon: '🌆' },
  ];

  const DAY_NAMES  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const selectedDate = value?.date || '';
  const selectedSlot = value?.slot || '';

  const isNow      = selectedDate === 'now';
  const isSameDay  = selectedDate === todayStr && selectedSlot === 'same_day';

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">📅 Delivery Option <span className="text-slate-400 font-normal">(optional)</span></p>

      {/* Urgent options row */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange({ date: 'now', slot: 'now' })}
          className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${isNow ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'}`}
        >
          <span className="text-2xl">⚡</span>
          <div className="text-left">
            <p className={`text-sm font-bold ${isNow ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>Now</p>
            <p className="text-xs text-slate-400">ASAP delivery</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChange({ date: todayStr, slot: 'same_day' })}
          className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${isSameDay ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-sky-300'}`}
        >
          <span className="text-2xl">🚀</span>
          <div className="text-left">
            <p className={`text-sm font-bold ${isSameDay ? 'text-sky-700 dark:text-sky-400' : 'text-slate-700 dark:text-slate-200'}`}>Same Day</p>
            <p className="text-xs text-slate-400">Today by 8pm</p>
          </div>
        </button>
      </div>

      {/* Schedule for another day */}
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Or schedule a date</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {futureDays.map(d => {
          const full = d.toISOString().split('T')[0];
          const isSelected = selectedDate === full;
          return (
            <button key={full} type="button"
              onClick={() => onChange({ date: full, slot: selectedSlot === 'same_day' ? '' : selectedSlot })}
              className={`flex-shrink-0 flex flex-col items-center rounded-xl border-2 px-3 py-2 min-w-[52px] transition-all ${isSelected ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30' : 'border-slate-200 dark:border-slate-700 hover:border-sky-300'}`}>
              <span className={`text-xs font-medium ${isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`}>{DAY_NAMES[d.getDay()]}</span>
              <span className={`text-lg font-extrabold ${isSelected ? 'text-sky-700 dark:text-sky-300' : 'text-slate-700 dark:text-slate-200'}`}>{d.getDate()}</span>
              <span className={`text-xs ${isSelected ? 'text-sky-500' : 'text-slate-400'}`}>{MONTH_NAMES[d.getMonth()]}</span>
            </button>
          );
        })}
      </div>

      {/* Time slot — show when a future date is selected */}
      {selectedDate && selectedDate !== 'now' && selectedSlot !== 'same_day' && (
        <div className="grid grid-cols-3 gap-2">
          {slots.map(s => {
            const isSel = selectedSlot === s.id;
            return (
              <button key={s.id} type="button"
                onClick={() => onChange({ date: selectedDate, slot: s.id })}
                className={`flex flex-col items-center rounded-xl border-2 p-3 transition-all ${isSel ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30' : 'border-slate-200 dark:border-slate-700 hover:border-sky-300'}`}>
                <span className="text-xl mb-1">{s.icon}</span>
                <span className={`text-xs font-bold ${isSel ? 'text-sky-700 dark:text-sky-300' : 'text-slate-700 dark:text-slate-200'}`}>{s.label}</span>
                <span className="text-xs text-slate-400 text-center mt-0.5">{s.time}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
