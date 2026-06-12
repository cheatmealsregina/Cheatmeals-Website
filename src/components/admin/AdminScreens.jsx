import React from 'react';
import { Screen } from '../shared/Screen.jsx';
import { Logo } from '../shared/Logo.jsx';
import { ThemeToggle } from '../shared/ThemeToggle.jsx';

const DS = window.CheatMealsDesignSystem_e4e564;
const data = window.CM_DATA;

export function AdminLogin({ mobile = true }) {
  const { Input, Button } = DS;
  return (
    <Screen mobile={mobile} label="Admin — login">
      <div className="pt-login">
        <Logo variant="icon" height={88} counter="var(--color-bg)" label="CheatMeals" />
        <h1 className="cm-display" style={{ margin: 0, fontSize: 'var(--text-3xl)' }}>ADMIN</h1>
        <div className="pt-login__card">
          <Input label="Phone or email" placeholder="(306) 541-9198" defaultValue="306-541-9198" />
          <Input label="Password" type="password" defaultValue="••••••" error="Incorrect password." />
          <Button variant="primary" size="lg">Sign In</Button>
        </div>
        <span className="cm-label" style={{ color: 'var(--color-text-muted)' }}>Staff only · cheatmeals.ca/admin</span>
      </div>
    </Screen>
  );
}

function EditCard() {
  const { Input, PriceInput, Toggle, Dropzone, Button, Badge } = DS;
  const [badges, setBadges] = React.useState({ pick: true, spicy1: true, spicy2: false, jain: false });
  const flip = (k) => setBadges({ ...badges, [k]: !badges[k] });
  return (
    <div className="pt-editcard">
      <Input label="Item name" defaultValue="Aloo Anarkali" />
      <PriceInput label="Price" value={12.99} />
      <div className="cm-field">
        <span className="cm-field__label">Badges</span>
        <div className="pt-badgepick" role="group" aria-label="Badge picker">
          <button type="button" aria-pressed={badges.pick} onClick={() => flip('pick')}>
            <Badge kind="pick">Chef's Pick</Badge>
          </button>
          <button type="button" aria-pressed={badges.spicy1} onClick={() => flip('spicy1')}>
            <Badge kind="spicy" level={1}>Spicy</Badge>
          </button>
          <button type="button" aria-pressed={badges.spicy2} onClick={() => flip('spicy2')}>
            <Badge kind="spicy" level={2}>Extra Spicy</Badge>
          </button>
          <button type="button" aria-pressed={badges.jain} onClick={() => flip('jain')}>
            <Badge kind="diet">Jain</Badge>
          </button>
        </div>
      </div>
      <Toggle label="Available" defaultChecked />
      <Dropzone />
      <div className="pt-editcard__actions">
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary">Save</Button>
      </div>
    </div>
  );
}

function EditorGroups({ editingName = 'Aloo Anarkali' }) {
  const { EditorRow, Button } = DS;
  const [avail, setAvail] = React.useState({ 'Achari Aloo': false });
  const sections = data.menus['Aloo Burgers'].sections;
  return (
    <React.Fragment>
      {sections.map((s) => (
        <div className="pt-rowgroup" key={s.title}>
          <div className="pt-rowgroup__head">
            <span className="cm-label">{s.title} {s.script ? s.script.toUpperCase() : ''} · {s.items.length}</span>
            <Button variant="ghost" size="sm" icon="plus">Add item</Button>
          </div>
          <div className="pt-rows">
            {s.items.map((it) =>
              it.name === editingName ? (
                <EditCard key={it.name} />
              ) : (
                <EditorRow
                  key={it.name}
                  name={it.name}
                  price={it.price}
                  available={avail[it.name] !== false}
                  dragging={it.name === 'Masala Aloo Tikki'}
                  onToggle={(v) => setAvail({ ...avail, [it.name]: v })}
                  onEdit={() => {}}
                />
              )
            )}
          </div>
        </div>
      ))}
    </React.Fragment>
  );
}

export function AdminEditor({ mobile = true }) {
  const { Tabs, Toast, Icon } = DS;
  const [tab, setTab] = React.useState(0);
  const crumbs = (
    <div className="pt-crumbs cm-label">
      <span>Menu</span>
      <Icon name="arrowRight" size={12} />
      <span>Aloo Burgers</span>
      <Icon name="arrowRight" size={12} />
      <span className="pt-crumb--here">Spicy Aloo Patty</span>
    </div>
  );
  const head = (
    <header className="pt-admin-head">
      <Logo variant="icon" height={34} counter="var(--color-surface)" label="CheatMeals admin" />
      <h1 className="cm-display">MENU EDITOR</h1>
      <ThemeToggle />
    </header>
  );

  if (mobile) {
    return (
      <Screen mobile label="Admin — menu editor">
        {head}
        <div className="pt-section" style={{ padding: 'var(--space-5) var(--space-4) var(--space-8)', gap: 'var(--space-4)' }}>
          {crumbs}
          <Tabs items={data.categories} active={tab} onChange={setTab} />
          <EditorGroups />
        </div>
        <div className="pt-toastdock"><Toast>Saved</Toast></div>
      </Screen>
    );
  }

  const sections = data.menus['Aloo Burgers'].sections;
  return (
    <Screen label="Admin — menu editor (desktop)">
      {head}
      <div className="pt-section" style={{ maxWidth: 1280 }}>
        <div className="pt-admin-grid">
          <nav className="pt-tree" aria-label="Menu tree">
            <span className="cm-label" style={{ color: 'var(--color-text-muted)', padding: 'var(--space-2) var(--space-3)' }}>Menu</span>
            {data.categories.map((c) => (
              <React.Fragment key={c}>
                <a href="#" aria-current={c === 'Aloo Burgers' ? 'true' : undefined}>{c}</a>
                {c === 'Aloo Burgers' ? (
                  <div className="pt-tree__sub">
                    {sections.map((s) => (
                      <a key={s.title} href="#">
                        {(s.title + ' ' + (s.script || '')).trim()}
                      </a>
                    ))}
                  </div>
                ) : null}
              </React.Fragment>
            ))}
          </nav>
          <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
            {crumbs}
            <EditorGroups />
          </div>
        </div>
      </div>
      <div className="pt-toastdock"><Toast>Saved</Toast></div>
    </Screen>
  );
}
