import { Award, Heart, Sparkles, UserRound } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TagListEditor } from './TagListEditor';
import { TextareaRow } from './FormRow';

/**
 * The Resume tab: a short self-description plus the Skills and Certification
 * panels from the wireframe.
 */
export function ResumeTab({ form, setField, editable }) {
  const resume = form.resume ?? {};

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="size-4 text-primary" aria-hidden="true" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <TextareaRow
            label="About"
            name="resume.about"
            value={resume.about}
            onChange={setField}
            editable={editable}
            rows={4}
            maxLength={2000}
            placeholder="A couple of lines about yourself…"
          />
          <TextareaRow
            label="What I love about my job"
            name="resume.love_about_job"
            value={resume.love_about_job}
            onChange={setField}
            editable={editable}
            rows={3}
            maxLength={2000}
            placeholder="The part of the work you look forward to…"
          />
          <TextareaRow
            label="My interests and hobbies"
            name="resume.interests"
            value={resume.interests}
            onChange={setField}
            editable={editable}
            rows={3}
            maxLength={2000}
            placeholder="Outside of work…"
          />
        </CardContent>
      </Card>

      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TagListEditor
              values={resume.skills ?? []}
              onChange={(values) => setField('resume.skills', values)}
              editable={editable}
              placeholder="e.g. React, Payroll compliance…"
              addLabel="Add Skills"
              emptyLabel="No skills listed yet."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="size-4 text-primary" aria-hidden="true" />
              Certification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TagListEditor
              values={resume.certifications ?? []}
              onChange={(values) => setField('resume.certifications', values)}
              editable={editable}
              placeholder="e.g. AWS Solutions Architect…"
              addLabel="Add Certification"
              emptyLabel="No certifications listed yet."
            />
          </CardContent>
        </Card>

        {!editable && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Heart className="size-3.5" aria-hidden="true" />
            Only this employee and HR can edit these details.
          </p>
        )}
      </div>
    </div>
  );
}
