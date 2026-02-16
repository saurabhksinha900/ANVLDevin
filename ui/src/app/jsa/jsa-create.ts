import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { HazardCatalogEntry, PPECatalogEntry } from '../models';

@Component({
  selector: 'app-jsa-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="jsa-create">
      <h1>Create New JSA</h1>
      <form (ngSubmit)="onSubmit()" class="form">
        <fieldset>
          <legend>Job Information</legend>
          <div class="form-row">
            <div class="form-group">
              <label>Job Type *</label>
              <select [(ngModel)]="form.jobType" name="jobType" required (change)="onJobTypeChange()">
                <option value="">Select job type</option>
                @for (jt of jobTypes; track jt) {
                  <option [value]="jt">{{ jt }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label>Business Unit *</label>
              <select [(ngModel)]="form.businessUnit" name="businessUnit" required>
                <option value="">Select</option>
                @for (bu of businessUnits; track bu) {
                  <option [value]="bu">{{ bu }}</option>
                }
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Location *</label>
              <input [(ngModel)]="form.location" name="location" required placeholder="Work location" />
            </div>
            <div class="form-group">
              <label>Date of Work *</label>
              <input type="date" [(ngModel)]="form.dateOfWork" name="dateOfWork" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Work Order</label>
              <input [(ngModel)]="form.workOrder" name="workOrder" placeholder="Optional" />
            </div>
            <div class="form-group">
              <label>Crew Members</label>
              <input [(ngModel)]="crewInput" name="crew" placeholder="Comma-separated names" />
            </div>
          </div>
          <div class="form-group full">
            <label>Job Description *</label>
            <textarea [(ngModel)]="form.jobDescription" name="jobDescription" required rows="3" placeholder="Describe the work to be performed"></textarea>
          </div>
          <div class="form-group full">
            <label>Additional Notes</label>
            <textarea [(ngModel)]="form.additionalNotes" name="additionalNotes" rows="2" placeholder="Optional notes"></textarea>
          </div>
        </fieldset>

        <fieldset>
          <legend>Hazards & Mitigations</legend>
          @for (hazard of form.hazards; track $index; let i = $index) {
            <div class="hazard-card">
              <div class="hazard-header">
                <h4>Hazard {{ i + 1 }}</h4>
                <button type="button" class="btn-remove" (click)="removeHazard(i)">Remove</button>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Category *</label>
                  <select [(ngModel)]="hazard.category" [name]="'hcat'+i" required (change)="onHazardCategoryChange(i)">
                    <option value="">Select</option>
                    @for (cat of hazardCatalog; track cat.category) {
                      <option [value]="cat.category">{{ cat.category }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>Risk Level *</label>
                  <select [(ngModel)]="hazard.riskLevel" [name]="'hrisk'+i" required>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
              <div class="form-group full">
                <label>Description *</label>
                <input [(ngModel)]="hazard.description" [name]="'hdesc'+i" required placeholder="Describe the hazard" />
              </div>
              <div class="form-group full">
                <label>Details</label>
                <textarea [(ngModel)]="hazard.details" [name]="'hdet'+i" rows="2" placeholder="Additional details"></textarea>
              </div>
              @if (hazard.lotoRequired) {
                <div class="loto-section">
                  <label><input type="checkbox" [(ngModel)]="hazard.lotoVerified" [name]="'hloto'+i" /> LOTO Verified</label>
                  <input [(ngModel)]="hazard.lotoNumber" [name]="'hloton'+i" placeholder="LOTO Number" />
                </div>
              }
              <div class="mitigations">
                <label>Mitigations</label>
                @for (mit of hazard.mitigations; track $index; let j = $index) {
                  <div class="mitigation-row">
                    <input [(ngModel)]="mit.description" [name]="'mit'+i+'_'+j" placeholder="Mitigation measure" />
                    <button type="button" class="btn-remove-sm" (click)="hazard.mitigations.splice(j, 1)">x</button>
                  </div>
                }
                <button type="button" class="btn-add-sm" (click)="addMitigation(i)">+ Add Mitigation</button>
              </div>
            </div>
          }
          <button type="button" class="btn-secondary" (click)="addHazard()">+ Add Hazard</button>
        </fieldset>

        <fieldset>
          <legend>PPE Checklist</legend>
          <div class="ppe-grid">
            @for (ppe of form.ppeChecklist; track $index; let i = $index) {
              <label class="ppe-item" [class.required]="ppe.isRequired">
                <input type="checkbox" [(ngModel)]="ppe.isChecked" [name]="'ppe'+i" />
                {{ ppe.label }}
                @if (ppe.isRequired) { <span class="req-badge">Required</span> }
              </label>
            }
          </div>
        </fieldset>

        @if (error) {
          <div class="error">{{ error }}</div>
        }

        <div class="actions">
          <button type="submit" class="btn-primary" [disabled]="saving">
            {{ saving ? 'Saving...' : 'Create JSA (Draft)' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .jsa-create { max-width: 900px; }
    h1 { margin: 0 0 1.5rem; color: #1a365d; }
    .form fieldset { border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem; background: white; }
    legend { font-weight: 600; color: #2d3748; padding: 0 0.5rem; font-size: 1rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: 0.75rem; }
    .form-group.full { grid-column: 1 / -1; }
    label { display: block; margin-bottom: 0.25rem; font-size: 0.8rem; font-weight: 500; color: #4a5568; }
    input, select, textarea { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 0.875rem; box-sizing: border-box; }
    textarea { resize: vertical; }
    .hazard-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem; margin-bottom: 1rem; background: #f7fafc; }
    .hazard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .hazard-header h4 { margin: 0; font-size: 0.9rem; }
    .btn-remove { background: #fed7d7; color: #742a2a; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; cursor: pointer; }
    .btn-remove-sm { background: none; border: none; color: #e53e3e; cursor: pointer; font-size: 1rem; padding: 0 0.25rem; }
    .btn-add-sm { background: none; border: 1px dashed #a0aec0; color: #4a5568; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; cursor: pointer; margin-top: 0.25rem; }
    .btn-secondary { background: white; border: 1px solid #e2e8f0; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-size: 0.875rem; }
    .btn-secondary:hover { background: #f7fafc; }
    .mitigations { margin-top: 0.5rem; }
    .mitigation-row { display: flex; gap: 0.5rem; margin-bottom: 0.25rem; }
    .mitigation-row input { flex: 1; }
    .loto-section { display: flex; gap: 1rem; align-items: center; background: #fffbeb; padding: 0.5rem; border-radius: 4px; margin-bottom: 0.5rem; }
    .ppe-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; }
    .ppe-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 0.85rem; cursor: pointer; }
    .ppe-item.required { border-color: #fbd38d; background: #fffbeb; }
    .ppe-item input[type="checkbox"] { width: auto; }
    .req-badge { font-size: 0.65rem; background: #fbd38d; color: #744210; padding: 0.1rem 0.3rem; border-radius: 3px; }
    .error { color: #e53e3e; margin-bottom: 1rem; padding: 0.5rem; background: #fff5f5; border-radius: 4px; }
    .actions { margin-top: 1rem; }
    .btn-primary { background: #3182ce; color: white; padding: 0.625rem 1.5rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; }
    .btn-primary:hover { background: #2c5282; }
    .btn-primary:disabled { background: #a0aec0; cursor: not-allowed; }
  `]
})
export class JSACreateComponent implements OnInit {
  form = {
    jobType: '',
    location: '',
    businessUnit: '',
    dateOfWork: new Date().toISOString().slice(0, 10),
    workOrder: '',
    jobDescription: '',
    additionalNotes: '',
    hazards: [] as Array<{
      category: string; description: string; riskLevel: string;
      details: string; lotoRequired: boolean; lotoVerified: boolean;
      lotoNumber: string; mitigations: Array<{ description: string; notes: string; isCustom: boolean }>;
    }>,
    ppeChecklist: [] as Array<{ ppeType: string; label: string; isChecked: boolean; isRequired: boolean }>,
  };
  crewInput = '';
  jobTypes: string[] = [];
  businessUnits: string[] = [];
  hazardCatalog: HazardCatalogEntry[] = [];
  ppeCatalog: PPECatalogEntry[] = [];
  saving = false;
  error = '';

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.api.getJobTypes().subscribe((t) => this.jobTypes = t);
    this.api.getBusinessUnits().subscribe((b) => this.businessUnits = b);
    this.api.getHazardCatalog().subscribe((h) => this.hazardCatalog = h);
    this.api.getPPECatalog().subscribe((p) => {
      this.ppeCatalog = p;
      this.form.ppeChecklist = p.map((item) => ({
        ppeType: item.type, label: item.label, isChecked: false, isRequired: item.alwaysRequired,
      }));
    });
  }

  onJobTypeChange(): void {
    const cat = this.hazardCatalog.find((h) => h.category === this.form.jobType);
    if (cat) {
      this.form.ppeChecklist.forEach((p) => {
        if (cat.requiredPPE.includes(p.ppeType)) p.isRequired = true;
      });
    }
  }

  onHazardCategoryChange(index: number): void {
    const hazard = this.form.hazards[index];
    const cat = this.hazardCatalog.find((h) => h.category === hazard.category);
    if (cat) {
      hazard.lotoRequired = cat.lotoRequired;
      hazard.mitigations = cat.mitigations.map((m) => ({ description: m, notes: '', isCustom: false }));
    }
  }

  addHazard(): void {
    this.form.hazards.push({
      category: '', description: '', riskLevel: 'MEDIUM', details: '',
      lotoRequired: false, lotoVerified: false, lotoNumber: '',
      mitigations: [],
    });
  }

  removeHazard(index: number): void {
    this.form.hazards.splice(index, 1);
  }

  addMitigation(hazardIndex: number): void {
    this.form.hazards[hazardIndex].mitigations.push({ description: '', notes: '', isCustom: true });
  }

  onSubmit(): void {
    this.error = '';
    this.saving = true;
    const data = {
      ...this.form,
      crewMembers: this.crewInput.split(',').map((s) => s.trim()).filter(Boolean),
    };
    this.api.createJSA(data as never).subscribe({
      next: (jsa) => { this.saving = false; this.router.navigate(['/jsas', jsa.id]); },
      error: (err) => { this.saving = false; this.error = err.error?.error?.message || 'Failed to create JSA'; },
    });
  }
}
