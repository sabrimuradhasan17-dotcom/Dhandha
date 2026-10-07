import ConfirmButton from './Confirm.js';
export const Flash = ({ q }) => <>{q.error && <p className="err" role="alert">{q.error}</p>}{q.ok && <p className="good" role="status">{q.ok}</p>}</>;
export const Field = ({ name, label, type = 'text', def = '', area, rows, ...r }) => <div><label htmlFor={name}>{label}</label>{area ? <textarea id={name} name={name} defaultValue={def ?? ''} style={rows ? { minHeight: rows * 24 } : undefined} {...r} /> : <input id={name} name={name} type={type} defaultValue={def ?? ''} {...r} />}</div>;
export const Del = ({ action, id, msg = 'Delete this item? This cannot be undone.' }) => <form action={action} style={{ display: 'inline' }}><input type="hidden" name="id" value={id} /><ConfirmButton message={msg}>Delete</ConfirmButton></form>;
