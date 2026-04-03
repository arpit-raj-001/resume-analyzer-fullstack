const fs = require('fs');
const sample = JSON.parse(fs.readFileSync('src/data/sample_resume.json', 'utf8'));
const tplFile = JSON.parse(fs.readFileSync('src/data/templates.json', 'utf8'));

const schema = [
  { "field": "name", "label": "Full Name", "type": "text", "required": true },
  { "field": "email", "label": "Email Address", "type": "email", "required": true },
  { "field": "phone", "label": "Phone Number", "type": "tel", "required": true },
  { "field": "location", "label": "Location", "type": "text", "required": true },
  { "field": "linkedin", "label": "LinkedIn Profile", "type": "url", "required": false },
  { "field": "summary", "label": "Professional Summary", "type": "textarea", "required": false },
  {
    "field": "experience",
    "label": "Work Experience",
    "type": "array",
    "fields": [
      { "name": "company", "label": "Company", "type": "text" },
      { "name": "role", "label": "Role", "type": "text" },
      { "name": "duration", "label": "Duration", "type": "text" },
      { "name": "description", "label": "Description", "type": "textarea" }
    ]
  },
  {
    "field": "education",
    "label": "Education",
    "type": "array",
    "fields": [
      { "name": "institution", "label": "Institution", "type": "text" },
      { "name": "degree", "label": "Degree", "type": "text" },
      { "name": "duration", "label": "Duration", "type": "text" }
    ]
  },
  {
    "field": "projects",
    "label": "Projects",
    "type": "array",
    "fields": [
      { "name": "title", "label": "Title", "type": "text" },
      { "name": "tech_stack", "label": "Tech Stack", "type": "text" },
      { "name": "description", "label": "Description", "type": "textarea" }
    ]
  },
  { "field": "skills", "label": "Core Skills (comma separated)", "type": "textarea", "required": false }
];

const sharedStyles = `
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  box-sizing: border-box;
`;

const twoColumnTemplate = (t) => {
  const isLeft = (t.layout.sidebar === 'left' || !t.layout.sidebar);
  const primary = t.style.primaryColor || '#2563EB';
  const secondary = t.style.secondaryColor || '#111827';
  const font = t.style.font || 'Inter';
  
  return `<div style="display:flex; align-items:stretch; font-family:'${font}', sans-serif; color:#374151; min-height:1122px; width:100%; background-color:white; ${sharedStyles}">
    <div style="width:280px; min-width:280px; max-width:280px; background-color:${secondary}; color:white; padding:50px 30px; display:flex; flex-direction:column; gap:35px; order:${isLeft ? 0 : 1}; flex-shrink:0;">
      <div style="display:flex; flex-direction:column; gap:10px;">
        <h1 style="font-size:28px; font-weight:800; margin:0; line-height:1.2; color:white; ${sharedStyles}">{{name}}</h1>
        <p style="font-size:14px; opacity:0.8; margin:0; font-weight:500; ${sharedStyles}">{{location}}</p>
      </div>
      <div style="display:flex; flex-direction:column; gap:15px; break-inside:avoid;">
        <h3 style="text-transform:uppercase; font-size:12px; font-weight:800; letter-spacing:1.5px; color:${primary}; margin:0;">Contact</h3>
        <div style="font-size:13px; display:flex; flex-direction:column; gap:8px; opacity:0.9; ${sharedStyles}">
          <p style="margin:0;">{{email}}</p>
          <p style="margin:0;">{{phone}}</p>
          <p style="margin:0;">{{linkedin}}</p>
        </div>
      </div>
      <div style="display:flex; flex-direction:column; gap:15px;">
        <h3 style="text-transform:uppercase; font-size:12px; font-weight:800; letter-spacing:1.5px; color:${primary}; margin:0;">Education</h3>
        {{#each education}}
          <div style="display:flex; flex-direction:column; gap:4px; break-inside:avoid; margin-bottom:10px;">
            <h4 style="font-size:13px; font-weight:700; margin:0; color:white; ${sharedStyles}">{{degree}}</h4>
            <p style="font-size:12px; opacity:0.8; margin:0; ${sharedStyles}">{{institution}}</p>
            <p style="font-size:11px; opacity:0.6; margin:0;">{{duration}}</p>
          </div>
        {{/each}}
      </div>
      <div style="display:flex; flex-direction:column; gap:15px; break-inside:avoid;">
        <h3 style="text-transform:uppercase; font-size:12px; font-weight:800; letter-spacing:1.5px; color:${primary}; margin:0;">Skills</h3>
        <p style="font-size:12px; line-height:1.8; opacity:0.8; margin:0; ${sharedStyles}">{{skills}}</p>
      </div>
    </div>
    <div style="flex:1; padding:60px 40px; background:white; display:flex; flex-direction:column; gap:35px; min-width:0;">
      <section style="break-inside:avoid;">
        <h3 style="text-transform:uppercase; font-size:13px; font-weight:800; letter-spacing:2px; color:${primary}; border-bottom:2.2px solid #F3F4F6; padding-bottom:10px; margin-bottom:15px;">Professional Summary</h3>
        <p style="font-size:13px; color:#4B5563; margin:0; line-height:1.7; ${sharedStyles}">{{summary}}</p>
      </section>
      <section>
        <h3 style="text-transform:uppercase; font-size:13px; font-weight:800; letter-spacing:2px; color:${primary}; border-bottom:2.2px solid #F3F4F6; padding-bottom:10px; margin-bottom:20px;">Work Experience</h3>
        <div style="display:flex; flex-direction:column; gap:25px;">
          {{#each experience}}
            <div style="display:flex; flex-direction:column; gap:6px; break-inside:avoid;">
              <div style="display:flex; justify-content:space-between; align-items:baseline; gap:10px;">
                <h4 style="font-size:16px; font-weight:700; color:#111827; margin:0; ${sharedStyles}">{{role}}</h4>
                <span style="font-size:11px; color:#9CA3AF; font-weight:600; flex-shrink:0;">{{duration}}</span>
              </div>
              <p style="font-size:13px; font-weight:600; color:${primary}; margin:0; ${sharedStyles}">{{company}}</p>
              <p style="font-size:13px; color:#4B5563; margin:0; line-height:1.6; ${sharedStyles}">{{description}}</p>
            </div>
          {{/each}}
        </div>
      </section>
      <section>
        <h3 style="text-transform:uppercase; font-size:13px; font-weight:800; letter-spacing:2px; color:${primary}; border-bottom:2.2px solid #F3F4F6; padding-bottom:10px; margin-bottom:20px;">Key Projects</h3>
        <div style="display:flex; flex-direction:column; gap:20px;">
          {{#each projects}}
            <div style="background-color:#F9FAFB; padding:15px; border-radius:8px; border:1px solid #F3F4F6; border-left:4px solid ${primary}; break-inside:avoid;">
              <h4 style="font-size:14px; font-weight:700; color:#111827; margin:0 0 4px 0; ${sharedStyles}">{{title}} — <span style="font-weight:400; color:#9CA3AF; font-size:12px; ${sharedStyles}">{{tech_stack}}</span></h4>
              <p style="font-size:12px; color:#6B7280; margin:0; line-height:1.5; ${sharedStyles}">{{description}}</p>
            </div>
          {{/each}}
        </div>
      </section>
    </div>
  </div>`;
};

const singleColumnTemplate = (t) => {
  const primary = t.style.primaryColor || '#111827';
  const font = t.style.font || 'Inter';
  
  return `<div style="padding:70px 8%; font-family:'${font}', sans-serif; color:#374151; min-height:1122px; width:100%; background-color:white; flex-direction:column; display:flex; ${sharedStyles}">
    <header style="text-align:center; margin-bottom:40px; display:flex; flex-direction:column; gap:8px; break-inside:avoid;">
      <h1 style="font-size:36px; font-weight:800; margin:0; color:#111827; letter-spacing:-1px; ${sharedStyles}">{{name}}</h1>
      <div style="font-size:13px; font-weight:500; color:#6B7280; display:flex; justify-content:center; gap:15px; flex-wrap:wrap; ${sharedStyles}">
        <span>{{email}}</span>
        <span>•</span>
        <span>{{phone}}</span>
        <span>•</span>
        <span>{{location}}</span>
      </div>
      <p style="font-size:12px; color:${primary}; font-weight:600; margin:0; ${sharedStyles}">{{linkedin}}</p>
    </header>

    <div style="display:flex; flex-direction:column; gap:35px;">
      <section style="break-inside:avoid;">
        <p style="font-size:14px; text-align:center; font-style:italic; line-height:1.8; color:#4B5563; margin:0; ${sharedStyles}">{{summary}}</p>
      </section>

      <section>
        <h3 style="text-transform:uppercase; font-size:12px; font-weight:800; letter-spacing:2px; color:${primary}; border-bottom:1.5px solid #E5E7EB; padding-bottom:6px; margin-bottom:18px;">Work Experience</h3>
        <div style="display:flex; flex-direction:column; gap:24px;">
          {{#each experience}}
            <div style="display:flex; flex-direction:column; gap:6px; break-inside:avoid;">
              <div style="display:flex; justify-content:space-between; align-items:baseline; gap:10px;">
                <h4 style="font-size:16px; font-weight:700; color:#111827; margin:0; ${sharedStyles}">{{role}}</h4>
                <span style="font-size:12px; font-weight:600; color:#9CA3AF; flex-shrink:0;">{{duration}}</span>
              </div>
              <p style="font-size:13px; font-weight:700; color:${primary}; text-transform:uppercase; margin:0; ${sharedStyles}">{{company}}</p>
              <p style="font-size:13px; color:#4B5563; margin:0; line-height:1.6; ${sharedStyles}">{{description}}</p>
            </div>
          {{/each}}
        </div>
      </section>

      <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:40px;">
        <section style="break-inside:avoid;">
          <h3 style="text-transform:uppercase; font-size:12px; font-weight:800; letter-spacing:2px; color:${primary}; border-bottom:1.5px solid #E5E7EB; padding-bottom:6px; margin-bottom:18px;">Education</h3>
          <div style="display:flex; flex-direction:column; gap:15px;">
            {{#each education}}
              <div style="display:flex; flex-direction:column; gap:4px; break-inside:avoid;">
                <h4 style="font-size:14px; font-weight:700; color:#111827; margin:0; ${sharedStyles}">{{degree}}</h4>
                <p style="font-size:13px; margin:0; color:#6B7280; ${sharedStyles}">{{institution}}</p>
                <p style="font-size:11px; margin:0; color:#9CA3AF;">{{duration}}</p>
              </div>
            {{/each}}
          </div>
        </section>
        <section style="break-inside:avoid;">
          <h3 style="text-transform:uppercase; font-size:12px; font-weight:800; letter-spacing:2px; color:${primary}; border-bottom:1.5px solid #E5E7EB; padding-bottom:6px; margin-bottom:18px;">Skills</h3>
          <p style="font-size:13px; color:#4B5563; line-height:1.8; margin:0; ${sharedStyles}">{{skills}}</p>
        </section>
      </div>

      <section>
        <h3 style="text-transform:uppercase; font-size:12px; font-weight:800; letter-spacing:2px; color:${primary}; border-bottom:1.5px solid #E5E7EB; padding-bottom:6px; margin-bottom:18px;">Key Projects</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
          {{#each projects}}
            <div style="padding:15px; background:#F9FAFB; border:1px solid #E5E7EB; border-radius:8px; break-inside:avoid;">
              <h4 style="font-size:14px; font-weight:700; color:#111827; margin:0 0 4px 0; ${sharedStyles}">{{title}}</h4>
              <p style="font-size:11px; font-weight:700; color:${primary}; margin:0 0 8px 0; letter-spacing:0.5px; ${sharedStyles}">{{tech_stack}}</p>
              <p style="font-size:12px; color:#6B7280; margin:0; line-height:1.5; ${sharedStyles}">{{description}}</p>
            </div>
          {{/each}}
        </div>
      </section>
    </div>
  </div>`;
};

tplFile.templates = tplFile.templates.map((t) => {
  t.sample_data = sample;
  t.form_schema = schema;
  if (t.layout.type === 'two_column') {
    t.html_template = twoColumnTemplate(t);
  } else {
    t.html_template = singleColumnTemplate(t);
  }
  return t;
});

fs.writeFileSync('src/data/templates.json', JSON.stringify(tplFile, null, 2));
console.log('Templates updated with full-height sidebars and improved wrapping.');
