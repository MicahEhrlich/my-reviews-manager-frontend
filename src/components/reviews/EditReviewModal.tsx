import { useEffect, useRef, useState } from "react";
import { Send, WandSparkles, X } from "lucide-react";
import type { Review } from "../../mockData";
import { Stars } from "../ui/Stars";

export interface EditReviewModalProps {
  review: Review;
  onClose: () => void;
  onSave: (text: string, approve: boolean) => void;
}

export function EditReviewModal({ review, onClose, onSave }: EditReviewModalProps) {
  const [text, setText] = useState(review.aiResponse ?? "");
  const [error, setError] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (approve: boolean) => {
    if (!text.trim()) return setError("יש להזין נוסח תגובה לפני השמירה");
    onSave(text.trim(), approve);
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && onClose()}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-title"><div className="modal-header"><div><span className="ai-kicker"><WandSparkles size={15} /> טיוטה שנוצרה בעזרת AI</span><h2 id="edit-title">עריכת תגובה</h2></div><button ref={closeRef} className="icon-button" onClick={onClose} aria-label="סגירת חלון"><X size={19} /></button></div><div className="review-context"><span className="avatar">{review.customerName.charAt(0)}</span><div><strong>{review.customerName}</strong><Stars rating={review.rating} size={13} /><p>{review.text}</p></div></div><label className="field-label" htmlFor="response-text">נוסח התגובה</label><textarea id="response-text" value={text} onChange={(event) => { setText(event.target.value); setError(""); }} rows={6} /><div className="editor-meta"><span>{text.length} תווים</span></div>{error && <p className="field-error" role="alert">{error}</p>}<div className="modal-actions"><button className="ghost-button" onClick={onClose}>ביטול</button><button className="secondary-button" onClick={() => submit(false)}>שמירת טיוטה</button><button className="primary-button" onClick={() => submit(true)}><Send size={17} /> שמירה, אישור ושליחה</button></div></div></div>;
}
