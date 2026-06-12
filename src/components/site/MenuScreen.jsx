import React from 'react';
import { Screen } from '../shared/Screen.jsx';
import { Nav } from '../shared/Nav.jsx';

const DS = window.CheatMealsDesignSystem_e4e564;
const data = window.CM_DATA;

/* flatten every populated menu into [{...item, category}] for search;
   the live menus already include Extra Fries (Add-Ons & Dips), the
   bundled fallback ships it separately — add it only if absent */
function allItems() {
  const out = [];
  Object.entries(data.menus).forEach(([category, menu]) => {
    (menu.sections || [{ items: menu.items || [] }]).forEach((s) => {
      s.items.forEach((it) => out.push({ ...it, category, section: s.title }));
    });
  });
  if (!out.some((it) => it.name === data.extraFries.name)) {
    out.push({ ...data.extraFries, category: 'Add-Ons & Dips' });
  }
  return out;
}

function matches(it, q) {
  const hay = (it.name + ' ' + (it.description || '')).toLowerCase();
  return hay.includes(q);
}

function isPick(it) {
  return (it.badges || []).some((b) => b.kind === 'pick');
}

function Cards({ items }) {
  const { MenuItemCard } = DS;
  return (
    <div className="pt-cards">
      {items.map((it) => (
        <MenuItemCard
          key={it.name}
          name={it.name}
          price={it.price}
          description={it.description}
          badges={it.badges || []}
          showMedia={it.name === 'The Red Hulk'}
        />
      ))}
    </div>
  );
}

function EmptyState({ line }) {
  return (
    <div className="pt-empty">
      <span className="cm-aside">{line}</span>
      <span className="cm-label" style={{ color: 'var(--color-text-muted)' }}>
        Ask at the counter — the menu moves fast.
      </span>
    </div>
  );
}

function MenuBody({ category, query, picksOnly }) {
  const { SectionHeader } = DS;
  const q = query.trim().toLowerCase();

  /* search mode — flat results across every category */
  if (q) {
    let found = allItems().filter((it) => matches(it, q));
    if (picksOnly) found = found.filter(isPick);
    if (!found.length) {
      return <EmptyState line={'No "' + query + '" here. The Red Hulk is judging your spelling.'} />;
    }
    return <Cards items={found} />;
  }

  const menu = data.menus[category];

  /* unpopulated category — voice-line empty state */
  if (!menu) {
    if (category === 'Add-Ons & Dips') {
      return <Cards items={[data.extraFries]} />;
    }
    return <EmptyState line={data.asides[category] || 'Coming off the tawa soon.'} />;
  }

  const filt = (items) => (picksOnly ? items.filter(isPick) : items);

  /* sectioned category (Aloo Burgers) */
  if (menu.sections) {
    const sections = menu.sections
      .map((s) => ({ ...s, items: filt(s.items) }))
      .filter((s) => s.items.length);
    return (
      <React.Fragment>
        {menu.note ? <p className="pt-catnote">{menu.note}</p> : null}
        {sections.length ? sections.map((s) => (
          <React.Fragment key={s.title}>
            <div className="pt-subhead">
              <SectionHeader as="h3" title={s.title + ' PATTY'} accent={s.accent} script={s.script} stars={false} />
            </div>
            <Cards items={s.items} />
          </React.Fragment>
        )) : <EmptyState line="No Chef's Picks in this section — yet." />}
      </React.Fragment>
    );
  }

  /* flat category (Frankies, Jain) */
  const items = filt(menu.items || []);
  return (
    <React.Fragment>
      {menu.kicker ? <span className="cm-label pt-catnote">{menu.kicker}</span> : null}
      {menu.tagline ? <p className="pt-catnote">{menu.tagline}</p> : null}
      {menu.note ? <p className="pt-catnote">{menu.note}</p> : null}
      {items.length ? <Cards items={items} /> : <EmptyState line="No Chef's Picks here — yet." />}
    </React.Fragment>
  );
}

export function MenuScreen({ mobile, showNav = true }) {
  const { SectionHeader, Tabs, Input, Toggle } = DS;
  const [tab, setTab] = React.useState(0);
  const [query, setQuery] = React.useState('');
  const [picksOnly, setPicksOnly] = React.useState(false);

  return (
    <Screen mobile={mobile} label="Menu">
      {showNav && !mobile ? <Nav mobile={false} active="Menu" /> : null}
      <div className="pt-section" id="menu">
        <SectionHeader title="THE MENU" accent="MENU" script="see" kicker="Smash hits" />
        <Tabs items={data.categories} active={tab} onChange={(i) => { setTab(i); setQuery(''); }} sticky />
        <div className="pt-toolbar">
          <Input
            label="Search"
            placeholder="Try aloo, paneer, schezwan…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Toggle label="Chef's Picks only" checked={picksOnly} onChange={setPicksOnly} />
        </div>
        <MenuBody category={data.categories[tab]} query={query} picksOnly={picksOnly} />
      </div>
    </Screen>
  );
}
