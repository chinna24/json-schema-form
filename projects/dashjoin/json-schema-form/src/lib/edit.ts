import { EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EditElementDialogComponent } from './edit-element-dialog.component';
import { Schema } from './schema';

/**
 * form editor - has a 1:1 relationship to form node
 */
export class Edit {

    /**
     * get access to parent object's fields
     *
     * @param schemaChange  signal a change
     * @param name          the current property name (key)
     * @param schema        the current schema
     * @param parent        the parent's schema (required in order to change the order)
     * @param dialog        dialog service
     */
    constructor(
        private schemaChange: EventEmitter<void>, private name: string, private schema: Schema, private parent: Schema,
        private dialog: MatDialog) {
    }

    /**
     * can add if addable is not empty
     */
    canAdd(): boolean {
        return this.addable().length > 0;
    }

    /**
     * get the entries in "properties" that are not in "order"
     */
    addable(): string[] {
        let s: Schema;
        if (this.schema.properties) {
            s = this.schema;
        } else if (this.schema.items?.properties) {
            s = this.schema.items;
        } else if (this.schema.additionalProperties?.properties) {
            s = this.schema.additionalProperties;
        } else {
            return [];
        }
        if (s.order) {
            const set = new Set(Object.keys(s.properties));
            for (const p of s.order) {
                if (Array.isArray(p)) {
                    for (const q of p) {
                        set.delete(q);
                    }
                } else {
                    set.delete(p);
                }
            }
            return Array.from(set);
        } else {
            return [];
        }
    }

    /**
     * add a hidden prop to the end of the list
     */
    addSub(prop: string) {
        const index = this.parent.order.indexOf(this.name);
        if (index >= 0) {
            this.parent.order[index] = [(this.parent.order[index] as string), prop];
        } else {
            for (const p of this.parent.order) {
                if (Array.isArray(p)) {
                    if (p.indexOf(this.name) >= 0) {
                        p.push(prop);
                    }
                }
            }
        }
        this.schemaChange.emit();
    }

    /**
     * can add if addable is not empty
     */
    canAddSub(): boolean {
        return this.subaddable().length > 0;
    }

    /**
     * get the entries in "properties" that are not in "order"
     */
    subaddable(): string[] {
        if (this.parent?.order) {
            const set = new Set(Object.keys(this.parent.properties));
            for (const p of this.parent.order) {
                if (Array.isArray(p)) {
                    for (const q of p) {
                        set.delete(q);
                    }
                } else {
                    set.delete(p);
                }
            }
            return Array.from(set);
        } else {
            return [];
        }
    }

    /**
     * add a hidden prop to the end of the list
     */
    add(prop: string) {
        if (this.schema.properties) {
            this.schema.order.push(prop);
        } else if (this.schema.items?.properties) {
            this.schema.items.order.push(prop);
        } else {
            this.schema.additionalProperties.order.push(prop);
        }
        this.schemaChange.emit();
    }

    /**
     * edit simple schema fields like title and description
     */
    edit() {
        const dialogRef = this.dialog.open(EditElementDialogComponent, { width: '500px', data: this.schema });
        dialogRef.afterClosed().subscribe(data => {
            if (data) {
                this.schema.title = data.title;
                this.schema.description = data.description;
                this.schema.widget = data.widget;
                this.schemaChange.emit();
            }
        });
    }

    /**
     * can hide if I my parent is an object
     */
    canHide(): boolean {
        return this.parent ? true : false;
    }

    /**
     * hide this prop
     */
    hide() {
        if (!this.parent.order) {
            this.parent.order = Object.keys(this.parent.properties);
        }
        let index = 0;
        for (const p of this.parent.order) {
            if (Array.isArray(p)) {
                if (p.indexOf(this.name) >= 0) {
                    p.splice(p.indexOf(this.name), 1);
                    if (p.length === 1) {
                        this.parent.order[index] = p[0];
                    }
                }
            }
            index++;
        }
        if (this.parent.order.indexOf(this.name) >= 0) {
            this.parent.order.splice(this.parent.order.indexOf(this.name), 1);
        }
        this.schemaChange.emit();
    }

    /**
     * can I go up
     */
    canUp(): boolean {
        if (!this.parent) {
            return false;
        }
        const props = this.parent.order ? this.parent.order : Object.keys(this.parent.properties);
        const index = props.indexOf(this.name);
        if (index >= 0) {
            return index > 0;
        } else {
            for (const p of props) {
                if (Array.isArray(p)) {
                    if (p.indexOf(this.name) >= 0) {
                        return p.indexOf(this.name) > 0;
                    }
                }
            }
        }
    }

    /**
     * go up
     */
    up() {
        if (!this.parent.order) {
            this.parent.order = Object.keys(this.parent.properties);
        }
        let index = this.parent.order.indexOf(this.name);
        if (index >= 0) {
            const tmp = this.parent.order[index - 1];
            this.parent.order[index - 1] = this.parent.order[index];
            this.parent.order[index] = tmp;
        } else {
            for (const p of this.parent.order) {
                if (Array.isArray(p)) {
                    index = p.indexOf(this.name);
                    if (index >= 0) {
                        const tmp = p[index - 1];
                        p[index - 1] = p[index];
                        p[index] = tmp;
                    }
                }
            }
        }
        this.schemaChange.emit();
    }

    /**
     * can I go down
     */
    canDown(): boolean {
        if (!this.parent) {
            return false;
        }
        const props = this.parent.order ? this.parent.order : Object.keys(this.parent.properties);
        const index = props.indexOf(this.name);
        if (index >= 0) {
            return index < props.length - 1;
        } else {
            for (const p of props) {
                if (Array.isArray(p)) {
                    if (p.indexOf(this.name) >= 0) {
                        return p.indexOf(this.name) < p.length - 1;
                    }
                }
            }
        }
    }

    /**
     * go down
     */
    down() {
        if (!this.parent.order) {
            this.parent.order = Object.keys(this.parent.properties);
        }
        let index = this.parent.order.indexOf(this.name);
        if (index >= 0) {
            const tmp = this.parent.order[index + 1];
            this.parent.order[index + 1] = this.parent.order[index];
            this.parent.order[index] = tmp;
        } else {
            for (const p of this.parent.order) {
                if (Array.isArray(p)) {
                    index = p.indexOf(this.name);
                    if (index >= 0) {
                        const tmp = p[index + 1];
                        p[index + 1] = p[index];
                        p[index] = tmp;
                    }
                }
            }
        }
        this.schemaChange.emit();
    }
}
