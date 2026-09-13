import { forwardRef, type TextareaHTMLAttributes } from "react";
import inputStyles from "./Input.module.css";
import styles from "./Textarea.module.css";
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { disableResize?: boolean; variant?: "default" | "clear"; }
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, disableResize = false, variant = "default", ...props }, ref) => <textarea ref={ref} className={`${inputStyles.input} ${styles.textarea} ${disableResize ? styles.noResize : ""} ${styles[variant]} ${className || ""}`} {...props} />);
Textarea.displayName = "Textarea";
