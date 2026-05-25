"use client";

import { type ReactNode } from "react";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type FieldSpan = "full" | "half";

export type OptionalFieldConfig = {
  colSpan?: FieldSpan;
  id: string;
  label: string;
  maxLength: number;
  placeholder?: string;
  showCounter?: boolean;
};

export type EventWebsiteSaveButtonProps = {
  disabled: boolean;
  hidden?: boolean;
  label: string;
  onClick: () => void;
};

export function EditorShell({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="event-editor-card">
      <header className="event-editor-header event-editor-header--optional">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <div className="event-editor-body">{children}</div>
    </div>
  );
}

export function EditorGroup({
  children,
  layout,
  title,
}: {
  children: ReactNode;
  layout?: "two-column";
  title: string;
}) {
  return (
    <section className="event-editor-group-card">
      <h2>{title}</h2>
      <FieldGrid layout={layout}>{children}</FieldGrid>
    </section>
  );
}

export function FieldGrid({
  children,
  layout,
}: {
  children: ReactNode;
  layout?: "two-column";
}) {
  return (
    <div className={`event-editor-fields${layout ? ` event-editor-fields--${layout}` : ""}`}>
      {children}
    </div>
  );
}

export function FieldShell({
  children,
  field,
  helper,
  value,
}: {
  children: ReactNode;
  field: OptionalFieldConfig;
  helper?: string;
  value: string;
}) {
  const id = `event-editor-${field.id}`;

  return (
    <div className={`event-editor-field event-editor-field--${field.colSpan ?? "full"}`}>
      <div className="event-editor-label-row">
        <Label htmlFor={id}>{field.label}</Label>
      </div>
      {children}
      <div className="event-editor-meta-row">
        {helper ? <p className="event-editor-helper">{helper}</p> : <span />}
        {field.showCounter === false ? null : (
          <span className="event-editor-counter">
            {value.length}/{field.maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

export function TextField({
  field,
  helper,
  inputType = "text",
  onChange,
  value,
}: {
  field: OptionalFieldConfig;
  helper?: string;
  inputType?: React.HTMLInputTypeAttribute;
  onChange: (value: string) => void;
  value: string;
}) {
  const id = `event-editor-${field.id}`;

  return (
    <FieldShell field={field} helper={helper} value={value}>
      <Input
        id={id}
        className="event-editor-input"
        maxLength={field.maxLength}
        placeholder={field.placeholder}
        type={inputType}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  );
}

export function TimeField({
  field,
  onChange,
  value,
}: {
  field: OptionalFieldConfig;
  onChange: (value: string) => void;
  value: string;
}) {
  return <TextField field={field} inputType="time" value={value} onChange={onChange} />;
}

export function TextAreaField({
  field,
  helper,
  onChange,
  value,
}: {
  field: OptionalFieldConfig;
  helper?: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const id = `event-editor-${field.id}`;

  return (
    <FieldShell field={field} helper={helper} value={value}>
      <Textarea
        id={id}
        className="event-editor-textarea"
        maxLength={field.maxLength}
        placeholder={field.placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  );
}

export function SelectField({
  field,
  onChange,
  options,
  value,
}: {
  field: OptionalFieldConfig;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  const id = `event-editor-${field.id}`;

  return (
    <FieldShell field={field} value={value}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="event-editor-select-trigger">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}

export function ListBuilder({
  addLabel,
  children,
  onAdd,
}: {
  addLabel: string;
  children: ReactNode;
  onAdd: () => void;
}) {
  return (
    <div className="event-editor-list-builder">
      <div className="event-editor-list-stack">{children}</div>
      <Button type="button" variant="outline" className="event-editor-list-add-button" onClick={onAdd}>
        <Plus className="size-4" aria-hidden="true" />
        {addLabel}
      </Button>
    </div>
  );
}

export function ListBuilderRow({
  canMoveDown,
  canMoveUp,
  children,
  hideGripIcon,
  onMoveDown,
  onMoveUp,
  onRemove,
  title,
}: {
  canMoveDown: boolean;
  canMoveUp: boolean;
  children: ReactNode;
  hideGripIcon?: boolean;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
  title: string;
}) {
  return (
    <div className="event-editor-list-row">
      <div className="event-editor-list-row-header">
        <div className="event-editor-list-row-title">
          {!hideGripIcon ? (
            <span className="event-editor-list-handle" aria-hidden="true">
              <GripVertical className="size-4" />
            </span>
          ) : null}
          <strong>{title}</strong>
        </div>
        <div className="event-editor-list-row-actions">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="event-editor-list-icon-button"
            disabled={!canMoveUp}
            aria-label={`Move ${title} up`}
            onClick={onMoveUp}
          >
            <ChevronUp className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="event-editor-list-icon-button"
            disabled={!canMoveDown}
            aria-label={`Move ${title} down`}
            onClick={onMoveDown}
          >
            <ChevronDown className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="event-editor-list-icon-button event-editor-list-icon-button--danger"
            aria-label={`Remove ${title}`}
            onClick={onRemove}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}

export function EditorSaveButton({
  disabled,
  hidden = false,
  label,
  onClick,
}: EventWebsiteSaveButtonProps) {
  if (hidden) {
    return null;
  }

  return (
    <div className="event-editor-actions">
      <Button
        type="button"
        className="event-editor-save-button"
        disabled={disabled}
        onClick={onClick}
      >
        {label}
      </Button>
    </div>
  );
}
