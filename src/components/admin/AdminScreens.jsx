import React from 'react';
import { Screen } from '../shared/Screen.jsx';
import { Logo } from '../shared/Logo.jsx';
import { ThemeToggle } from '../shared/ThemeToggle.jsx';

const DS = window.CheatMealsDesignSystem_e4e564;

/* Auth plumbing — supabase is imported lazily so a missing env config
   can only ever affect the admin screens, never the public site. */
function getSupabase() {
  return import('../../lib/supabase.js').then((m) => m.supabase);
}

/* Session state for the /admin route guard: resolves the persisted
   session on mount, then tracks sign-in/sign-out events. */
export function useAdminSession() {
  const [state, setState] = React.useState({ loading: true, session: null });
  React.useEffect(() => {
    let mounted = true;
    let sub = null;
    getSupabase()
      .then((sb) => {
        if (!mounted) return;
        sb.auth.getSession().then(({ data: d }) => {
          if (mounted) setState({ loading: false, session: d.session });
        });
        sub = sb.auth.onAuthStateChange((_evt, session) => {
          if (mounted) setState({ loading: false, session });
        }).data.subscription;
      })
      .catch(() => {
        if (mounted) setState({ loading: false, session: null });
      });
    return () => {
      mounted = false;
      if (sub) sub.unsubscribe();
    };
  }, []);
  return state;
}

/* ============================================================ login */
export function AdminLogin({ mobile = true }) {
  const { Input, Button } = DS;
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  const signIn = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const sb = await getSupabase();
      const { error: err } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (err) setError('Not the secret recipe. Try again.');
      /* success: onAuthStateChange flips the route guard to the editor */
    } catch (e) {
      setError("Kitchen's offline — try again in a minute.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen mobile={mobile} label="Admin — login">
      <div className="pt-login">
        <Logo variant="icon" height={88} counter="var(--color-bg)" label="CheatMeals" />
        <h1 className="cm-display" style={{ margin: 0, fontSize: 'var(--text-3xl)' }}>ADMIN</h1>
        <form
          className="pt-login__card"
          onSubmit={(e) => { e.preventDefault(); signIn(); }}
        >
          <Input
            label="Email"
            type="email"
            inputMode="email"
            placeholder="you@cheatmeals.ca"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error || undefined}
            autoComplete="current-password"
          />
          <Button type="submit" variant="primary" size="lg" disabled={busy}>Sign In</Button>
        </form>
        <span className="cm-label" style={{ color: 'var(--color-text-muted)' }}>Staff only · cheatmeals.ca/admin</span>
      </div>
    </Screen>
  );
}

/* ============================================================ db ops
   Every write re-selects the affected rows: with RLS, an unauthorized
   write "succeeds" with zero rows — that must surface as a failure so
   the UI can revert and show the error toast. */
async function dbUpdateItem(id, patch) {
  const sb = await getSupabase();
  const { data, error } = await sb.from('items').update(patch).eq('id', id).select();
  if (error) throw error;
  if (!data || !data.length) throw new Error('No row updated — are you signed in?');
  return data[0];
}

async function dbInsertItem(values) {
  const sb = await getSupabase();
  const { data, error } = await sb.from('items').insert(values).select();
  if (error) throw error;
  if (!data || !data.length) throw new Error('No row inserted — are you signed in?');
  return data[0];
}

async function dbDeleteItem(id) {
  const sb = await getSupabase();
  const { data, error } = await sb.from('items').delete().eq('id', id).select();
  if (error) throw error;
  if (!data || !data.length) throw new Error('No row deleted — are you signed in?');
}

async function dbUpdateCategoryNote(id, note) {
  const sb = await getSupabase();
  const { data, error } = await sb.from('categories').update({ note }).eq('id', id).select();
  if (error) throw error;
  if (!data || !data.length) throw new Error('No row updated — are you signed in?');
}

async function dbUpsertSiteContent(key, value) {
  const sb = await getSupabase();
  const { data, error } = await sb.from('site_content').upsert({ key, value }).select();
  if (error) throw error;
  if (!data || !data.length) throw new Error('Nothing saved — are you signed in?');
}

/* ---------- photo pipeline: resize to max 1200px WebP, upload ---------- */
async function resizeToWebP(file, max = 1200) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
  if (!blob) throw new Error('Could not encode the photo');
  return blob;
}

async function uploadPhoto(file, itemKey) {
  const blob = await resizeToWebP(file);
  const sb = await getSupabase();
  const path = `items/${itemKey}-${Date.now()}.webp`;
  const { error } = await sb.storage
    .from('menu-photos')
    .upload(path, blob, { contentType: 'image/webp', upsert: true });
  if (error) throw error;
  return sb.storage.from('menu-photos').getPublicUrl(path).data.publicUrl;
}

/* ---------- badges jsonb <-> picker state ---------- */
function badgesToState(badges) {
  const s = { pick: false, spicy1: false, spicy2: false, jain: false };
  for (const b of badges || []) {
    if (b.kind === 'pick') s.pick = true;
    else if (b.kind === 'spicy' && b.level === 2) s.spicy2 = true;
    else if (b.kind === 'spicy') s.spicy1 = true;
    else if (b.kind === 'diet') s.jain = true;
  }
  return s;
}
function stateToBadges(s) {
  const out = [];
  if (s.pick) out.push({ kind: 'pick', label: "Chef's Pick" });
  if (s.spicy2) out.push({ kind: 'spicy', level: 2, label: 'Extra Spicy' });
  else if (s.spicy1) out.push({ kind: 'spicy', level: 1, label: 'Spicy' });
  if (s.jain) out.push({ kind: 'diet', label: 'Jain' });
  return out;
}

/* ---------- toast ---------- */
function useToast() {
  const [toast, setToast] = React.useState(null);
  const timer = React.useRef(null);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const show = React.useCallback((msg, icon) => {
    clearTimeout(timer.current);
    setToast({ msg, icon });
    timer.current = setTimeout(() => setToast(null), 2200);
  }, []);
  return {
    toast,
    saved: React.useCallback(() => show('Saved', 'check'), [show]),
    errorToast: React.useCallback((msg) => show(msg || "Didn't save — try again.", 'alert'), [show]),
  };
}

/* ============================================================ edit card */
function EditCard({ item, section, categoryId, nextSort, onDone, onDeleted, onPatched, saved, errorToast }) {
  const { Input, Textarea, PriceInput, Toggle, Dropzone, Button, Badge, Modal } = DS;
  const isNew = !item;
  const [name, setName] = React.useState(item ? item.name : '');
  const [desc, setDesc] = React.useState((item && item.description) || '');
  const [price, setPrice] = React.useState(item ? item.price : null);
  const [badges, setBadges] = React.useState(badgesToState(item && item.badges));
  const [avail, setAvail] = React.useState(item ? item.is_available : true);
  const [photoUrl, setPhotoUrl] = React.useState((item && item.photo_url) || null);
  const [busy, setBusy] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const cardRef = React.useRef(null);

  /* The DS Modal ships role/aria-modal but no keyboard behaviour. For a
     destructive confirm we add Escape-to-close, move focus into the dialog
     on open, and restore it to the trigger on close. */
  React.useEffect(() => {
    if (!confirmDelete) return;
    const opener = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') setConfirmDelete(false); };
    document.addEventListener('keydown', onKey);
    const focusTimer = setTimeout(() => {
      const btn = document.querySelector('.cm-modal button');
      if (btn) btn.focus();
    }, 0);
    return () => {
      document.removeEventListener('keydown', onKey);
      clearTimeout(focusTimer);
      if (opener && typeof opener.focus === 'function') opener.focus();
    };
  }, [confirmDelete]);

  const flip = (k) => setBadges({ ...badges, [k]: !badges[k] });

  const onFiles = async (files) => {
    const f = files && files[0];
    if (!f || !f.type.startsWith('image/')) return;
    setBusy(true);
    try {
      const url = await uploadPhoto(f, item ? item.id : 'new');
      setPhotoUrl(url);
      if (item) {
        await dbUpdateItem(item.id, { photo_url: url });
        if (onPatched) onPatched({ photo_url: url });
      }
      saved();
    } catch (e) {
      console.warn('[admin] photo upload failed:', e);
      errorToast("Photo didn't upload — try again.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    /* read the price field from the DOM so a cleared field saves null ("N/A") */
    const raw = cardRef.current.querySelector('.cm-price .cm-input').value.trim();
    const parsed = parseFloat(raw.replace(/[^0-9.]/g, ''));
    const priceVal = raw === '' || isNaN(parsed) ? null : Math.round(parsed * 100) / 100;
    if (!name.trim()) {
      errorToast('Name the burger first.');
      return;
    }
    setBusy(true);
    const patch = {
      name: name.trim(),
      description: desc.trim() || null,
      price: priceVal,
      badges: stateToBadges(badges),
      is_available: avail,
    };
    try {
      if (isNew) {
        const row = await dbInsertItem({
          ...patch,
          category_id: categoryId,
          section: section || null,
          photo_url: photoUrl,
          sort_order: nextSort,
        });
        saved();
        onDone(true, row);
      } else {
        const row = await dbUpdateItem(item.id, patch);
        saved();
        onDone(true, row);
      }
    } catch (e) {
      console.warn('[admin] save failed:', e);
      errorToast();
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await dbDeleteItem(item.id);
      saved();
      onDeleted();
    } catch (e) {
      console.warn('[admin] delete failed:', e);
      errorToast("Couldn't delete — try again.");
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="pt-editcard" ref={cardRef}>
      <Input label="Item name" value={name} onChange={(e) => setName(e.target.value)} />
      <Textarea
        label="Description"
        rows={2}
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Optional — or let the name do the talking"
      />
      <PriceInput label="Price" value={price} onChange={setPrice} />
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
      <Toggle label="Available" checked={avail} onChange={setAvail} />
      {photoUrl ? <img className="pt-editcard__photo" src={photoUrl} alt={name || 'Item photo'} loading="lazy" decoding="async" /> : null}
      <Dropzone onFiles={onFiles} hint={photoUrl ? 'Drop a new photo to replace it' : undefined} />
      <div className="pt-editcard__actions">
        {!isNew ? (
          <Button variant="ghost" onClick={() => setConfirmDelete(true)} disabled={busy}>Delete</Button>
        ) : null}
        <Button variant="ghost" onClick={() => onDone(false)} disabled={busy}>Cancel</Button>
        <Button variant="primary" onClick={save} disabled={busy}>Save</Button>
      </div>
      <Modal
        open={confirmDelete}
        title="Delete this item?"
        onClose={() => setConfirmDelete(false)}
        actions={
          <React.Fragment>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={busy}>Keep it</Button>
            <Button variant="primary" onClick={doDelete} disabled={busy}>Delete</Button>
          </React.Fragment>
        }
      >
        <p style={{ margin: 0 }}>{name || 'This item'} comes off the menu everywhere. No undo.</p>
      </Modal>
    </div>
  );
}

/* ============================================================ rows + reorder */
function groupBySection(items) {
  const order = [];
  const map = new Map();
  for (const it of items) {
    const key = it.section || '';
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key).push(it);
  }
  return order.map((k) => ({ title: k, items: map.get(k) }));
}

function EditorGroups({ items, categoryId, mutate, saved, errorToast }) {
  const { EditorRow, Button } = DS;
  const [editingId, setEditingId] = React.useState(null);
  const [addingIn, setAddingIn] = React.useState(null); // section title or '' for unsectioned
  const [drag, setDrag] = React.useState(null); // { id, dy, rowH }
  const dragRef = React.useRef(null);

  const groups = groupBySection(items);
  const nextSort = items.length ? Math.max(...items.map((i) => i.sort_order)) + 1 : 1;

  const toggleAvail = async (it, v) => {
    mutate((list) => list.map((x) => (x.id === it.id ? { ...x, is_available: v } : x)));
    try {
      await dbUpdateItem(it.id, { is_available: v });
      saved();
    } catch (e) {
      console.warn('[admin] availability toggle failed:', e);
      mutate((list) => list.map((x) => (x.id === it.id ? { ...x, is_available: !v } : x)));
      errorToast();
    }
  };

  /* pointer-drag reorder within a group (touch-friendly: the handle has
     touch-action none). Drop reassigns the group's existing sort_order
     slots, so only rows that actually moved get written. */
  const startDrag = (e, group, item) => {
    if (!e.target.closest('.cm-editor-row__drag')) return;
    if (editingId || addingIn !== null) return;
    e.preventDefault();
    const wrap = e.currentTarget;
    const rowH = wrap.getBoundingClientRect().height + 8;
    const state = { id: item.id, startY: e.clientY, dy: 0, rowH, group };
    dragRef.current = state;
    setDrag({ id: item.id, dy: 0 });

    const move = (ev) => {
      state.dy = ev.clientY - state.startY;
      setDrag({ id: state.id, dy: state.dy });
    };
    const up = async () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      dragRef.current = null;
      setDrag(null);
      const from = state.group.items.findIndex((x) => x.id === state.id);
      const to = Math.max(
        0,
        Math.min(state.group.items.length - 1, from + Math.round(state.dy / state.rowH))
      );
      if (to === from) return;
      const slots = state.group.items.map((x) => x.sort_order).sort((a, b) => a - b);
      const reordered = [...state.group.items];
      const [moved] = reordered.splice(from, 1);
      reordered.splice(to, 0, moved);
      const updates = [];
      const next = reordered.map((x, i) => {
        if (x.sort_order !== slots[i]) updates.push({ id: x.id, sort_order: slots[i] });
        return { ...x, sort_order: slots[i] };
      });
      const prev = state.group.items;
      mutate((list) =>
        list
          .map((x) => next.find((n) => n.id === x.id) || x)
          .sort((a, b) => a.sort_order - b.sort_order)
      );
      try {
        await Promise.all(updates.map((u) => dbUpdateItem(u.id, { sort_order: u.sort_order })));
        saved();
      } catch (err) {
        console.warn('[admin] reorder failed:', err);
        mutate((list) =>
          list
            .map((x) => prev.find((p) => p.id === x.id) || x)
            .sort((a, b) => a.sort_order - b.sort_order)
        );
        errorToast();
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <React.Fragment>
      {groups.map((g) => (
        <div className="pt-rowgroup" key={g.title || '_'}>
          <div className="pt-rowgroup__head">
            <span className="cm-label">{(g.title || 'Items')} · {g.items.length}</span>
            <Button variant="ghost" size="sm" icon="plus" onClick={() => { setAddingIn(g.title); setEditingId(null); }}>
              Add item
            </Button>
          </div>
          <div className="pt-rows">
            {g.items.map((it) =>
              editingId === it.id ? (
                <EditCard
                  key={it.id}
                  item={it}
                  categoryId={categoryId}
                  saved={saved}
                  errorToast={errorToast}
                  onPatched={(row) => {
                    mutate((list) => list.map((x) => (x.id === it.id ? { ...x, ...row } : x)));
                  }}
                  onDone={(didSave, row) => {
                    setEditingId(null);
                    if (didSave && row) {
                      mutate((list) => list.map((x) => (x.id === it.id ? { ...x, ...row, price: row.price === null ? null : Number(row.price) } : x)));
                    }
                  }}
                  onDeleted={() => {
                    setEditingId(null);
                    mutate((list) => list.filter((x) => x.id !== it.id));
                  }}
                />
              ) : (
                <div
                  key={it.id}
                  className="pt-rowwrap"
                  onPointerDown={(e) => startDrag(e, g, it)}
                  style={
                    drag && drag.id === it.id
                      ? { transform: `translateY(${drag.dy}px)`, position: 'relative', zIndex: 2 }
                      : undefined
                  }
                >
                  <EditorRow
                    name={it.name}
                    price={it.price === null ? 'N/A' : it.price}
                    available={it.is_available}
                    dragging={!!drag && drag.id === it.id}
                    onToggle={(v) => toggleAvail(it, v)}
                    onEdit={() => { setEditingId(it.id); setAddingIn(null); }}
                  />
                </div>
              )
            )}
            {addingIn === g.title ? (
              <EditCard
                item={null}
                section={g.title || null}
                categoryId={categoryId}
                nextSort={nextSort}
                saved={saved}
                errorToast={errorToast}
                onDone={(didSave, row) => {
                  setAddingIn(null);
                  if (didSave && row) {
                    mutate((list) =>
                      list
                        .concat({ ...row, price: row.price === null ? null : Number(row.price) })
                        .sort((a, b) => a.sort_order - b.sort_order)
                    );
                  }
                }}
              />
            ) : null}
          </div>
        </div>
      ))}
      {groups.length === 0 ? (
        <div className="pt-rowgroup">
          <div className="pt-rowgroup__head">
            <span className="cm-label">Items · 0</span>
            <Button variant="ghost" size="sm" icon="plus" onClick={() => setAddingIn('')}>Add item</Button>
          </div>
          <div className="pt-rows">
            {addingIn === '' ? (
              <EditCard
                item={null}
                section={null}
                categoryId={categoryId}
                nextSort={1}
                saved={saved}
                errorToast={errorToast}
                onDone={(didSave, row) => {
                  setAddingIn(null);
                  if (didSave && row) {
                    mutate((list) => list.concat({ ...row, price: row.price === null ? null : Number(row.price) }));
                  }
                }}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </React.Fragment>
  );
}

/* ============================================================ category note */
function CategoryNote({ category, onSaved, saved, errorToast }) {
  const { Textarea, Button } = DS;
  const [note, setNote] = React.useState(category.note || '');
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => setNote(category.note || ''), [category.id]);

  const save = async () => {
    setBusy(true);
    try {
      await dbUpdateCategoryNote(category.id, note.trim() || null);
      saved();
      onSaved(note.trim() || null);
    } catch (e) {
      console.warn('[admin] note save failed:', e);
      errorToast();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pt-notefield">
      <Textarea
        label="Category note"
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Shown under the category header"
        hint="Voice lines live here — keep it cheeky"
      />
      <Button variant="ghost" size="sm" onClick={save} disabled={busy}>Save note</Button>
    </div>
  );
}

/* ============================================================ site content */
function SiteContentEditor({ site, onSaved, saved, errorToast }) {
  const { Input, Textarea, Button } = DS;
  const [announcement, setAnnouncement] = React.useState(site.announcement || '');
  const [aboutCopy, setAboutCopy] = React.useState((site.about && site.about.copy) || '');
  const [hours, setHours] = React.useState(site.hours || []);
  const [team, setTeam] = React.useState(site.team || []);
  const [busy, setBusy] = React.useState(null);

  const persist = async (key, value, label) => {
    setBusy(label);
    try {
      await dbUpsertSiteContent(key, value);
      saved();
      onSaved(key, value);
    } catch (e) {
      console.warn('[admin] site content save failed:', e);
      errorToast();
    } finally {
      setBusy(null);
    }
  };

  return (
    <React.Fragment>
      <div className="pt-rowgroup">
        <div className="pt-rowgroup__head"><span className="cm-label">Announcement</span></div>
        <div className="pt-sitefields">
          <Input label="Announcement bar" value={announcement} onChange={(e) => setAnnouncement(e.target.value)} />
          <Button variant="ghost" size="sm" disabled={busy === 'announcement'} onClick={() => persist('announcement', announcement.trim(), 'announcement')}>
            Save announcement
          </Button>
        </div>
      </div>

      <div className="pt-rowgroup">
        <div className="pt-rowgroup__head"><span className="cm-label">About story</span></div>
        <div className="pt-sitefields">
          <Textarea label="Our story" rows={4} value={aboutCopy} onChange={(e) => setAboutCopy(e.target.value)} />
          <Button variant="ghost" size="sm" disabled={busy === 'about'} onClick={() => persist('about', { ...(site.about || {}), copy: aboutCopy.trim() }, 'about')}>
            Save story
          </Button>
        </div>
      </div>

      <div className="pt-rowgroup">
        <div className="pt-rowgroup__head"><span className="cm-label">Hours</span></div>
        <div className="pt-sitefields">
          {hours.map((h, i) => (
            <Input
              key={h.day}
              label={h.day}
              value={h.time}
              onChange={(e) => setHours(hours.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)))}
            />
          ))}
          <Button variant="ghost" size="sm" disabled={busy === 'hours'} onClick={() => persist('hours', hours, 'hours')}>
            Save hours
          </Button>
        </div>
      </div>

      <div className="pt-rowgroup">
        <div className="pt-rowgroup__head"><span className="cm-label">Team</span></div>
        <div className="pt-sitefields">
          {team.map((m, i) => (
            <React.Fragment key={i}>
              <Input
                label={'Member ' + (i + 1) + ' name'}
                value={m.name}
                onChange={(e) => setTeam(team.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
              />
              <Textarea
                label={'Member ' + (i + 1) + ' bio'}
                rows={2}
                value={m.bio}
                onChange={(e) => setTeam(team.map((x, j) => (j === i ? { ...x, bio: e.target.value } : x)))}
              />
            </React.Fragment>
          ))}
          <Button variant="ghost" size="sm" disabled={busy === 'team'} onClick={() => persist('team', team, 'team')}>
            Save team
          </Button>
        </div>
      </div>
    </React.Fragment>
  );
}

/* ============================================================ editor shell */
async function fetchAdminData() {
  const sb = await getSupabase();
  const [cats, items, site] = await Promise.all([
    sb.from('categories').select('id,name,slug,sort_order,note,is_dietary').order('sort_order'),
    sb.from('items').select('id,category_id,section,name,description,price,badges,photo_url,is_available,sort_order').order('sort_order'),
    sb.from('site_content').select('key,value'),
  ]);
  if (cats.error) throw cats.error;
  if (items.error) throw items.error;
  if (site.error) throw site.error;
  return {
    cats: cats.data,
    items: items.data.map((i) => ({ ...i, price: i.price === null ? null : Number(i.price) })),
    site: Object.fromEntries(site.data.map((r) => [r.key, r.value])),
  };
}

export function AdminEditor({ mobile = true }) {
  const { Tabs, Toast, Icon, Button } = DS;
  const [db, setDb] = React.useState(null);
  const [loadError, setLoadError] = React.useState(false);
  const [view, setView] = React.useState(0); // 0 = Menu, 1 = Site
  const [tab, setTab] = React.useState(0);
  const { toast, saved, errorToast } = useToast();

  React.useEffect(() => {
    let mounted = true;
    fetchAdminData()
      .then((d) => mounted && setDb(d))
      .catch((e) => {
        console.warn('[admin] load failed:', e);
        if (mounted) setLoadError(true);
      });
    return () => { mounted = false; };
  }, []);

  const signOut = async () => {
    try {
      const sb = await getSupabase();
      await sb.auth.signOut();
    } catch (e) {
      console.warn('[admin] sign-out failed:', e);
    }
  };

  const head = (
    <header className="pt-admin-head">
      <Logo variant="icon" height={34} counter="var(--color-surface)" label="CheatMeals admin" />
      <h1 className="cm-display">MENU EDITOR</h1>
      <ThemeToggle />
      <Button variant="ghost" size="sm" onClick={signOut}>Sign Out</Button>
    </header>
  );

  if (loadError) {
    return (
      <Screen mobile={mobile} label="Admin — menu editor">
        {head}
        <div className="pt-empty">
          <span className="cm-aside">The kitchen's offline.</span>
          <span className="cm-label" style={{ color: 'var(--color-text-muted)' }}>Reload to try again.</span>
        </div>
      </Screen>
    );
  }

  if (!db) {
    return (
      <Screen mobile={mobile} label="Admin — menu editor">
        {head}
        <div className="pt-boot" role="status" aria-label="Loading" style={{ minHeight: '50dvh' }}>
          <span className="pt-boot__dot" /><span className="pt-boot__dot" /><span className="pt-boot__dot" />
        </div>
      </Screen>
    );
  }

  const activeCat = db.cats[tab];
  const catItems = db.items.filter((i) => i.category_id === activeCat.id);
  const mutateItems = (fn) => setDb((d) => ({ ...d, items: fn(d.items) }));

  const crumbs = (
    <div className="pt-crumbs cm-label">
      <span>Menu</span>
      <Icon name="arrowRight" size={12} />
      <span className="pt-crumb--here">{view === 1 ? 'Site content' : activeCat.name}</span>
    </div>
  );

  const menuBody = (
    <React.Fragment>
      <Tabs items={db.cats.map((c) => c.name)} active={tab} onChange={setTab} />
      <CategoryNote
        key={activeCat.id}
        category={activeCat}
        saved={saved}
        errorToast={errorToast}
        onSaved={(note) => setDb((d) => ({ ...d, cats: d.cats.map((c) => (c.id === activeCat.id ? { ...c, note } : c)) }))}
      />
      <EditorGroups
        items={catItems}
        categoryId={activeCat.id}
        mutate={mutateItems}
        saved={saved}
        errorToast={errorToast}
      />
    </React.Fragment>
  );

  const siteBody = (
    <SiteContentEditor
      site={db.site}
      saved={saved}
      errorToast={errorToast}
      onSaved={(key, value) => setDb((d) => ({ ...d, site: { ...d.site, [key]: value } }))}
    />
  );

  const body = (
    <React.Fragment>
      {crumbs}
      <Tabs items={['Menu', 'Site content']} active={view} onChange={setView} />
      {view === 0 ? menuBody : siteBody}
    </React.Fragment>
  );

  const dock = toast ? (
    <div className="pt-toastdock"><Toast icon={toast.icon}>{toast.msg}</Toast></div>
  ) : null;

  if (mobile) {
    return (
      <Screen mobile label="Admin — menu editor">
        {head}
        <div className="pt-section" style={{ padding: 'var(--space-5) var(--space-4) var(--space-8)', gap: 'var(--space-4)' }}>
          {body}
        </div>
        {dock}
      </Screen>
    );
  }

  return (
    <Screen label="Admin — menu editor (desktop)">
      {head}
      <div className="pt-section" style={{ maxWidth: 1280 }}>
        <div className="pt-admin-grid">
          <nav className="pt-tree" aria-label="Menu tree">
            <span className="cm-label" style={{ color: 'var(--color-text-muted)', padding: 'var(--space-2) var(--space-3)' }}>Menu</span>
            {db.cats.map((c, i) => (
              <button
                key={c.id}
                type="button"
                aria-current={view === 0 && i === tab ? 'true' : undefined}
                onClick={() => { setView(0); setTab(i); }}
              >
                {c.name}
              </button>
            ))}
            <button
              type="button"
              aria-current={view === 1 ? 'true' : undefined}
              onClick={() => setView(1)}
            >
              Site content
            </button>
          </nav>
          <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
            {body}
          </div>
        </div>
      </div>
      {dock}
    </Screen>
  );
}
