import React from 'react';

const DS = window.CheatMealsDesignSystem_e4e564;
const data = window.CM_DATA;

/* Mobile sticky bottom bar — full-width call button. The theme toggle and the
   "While you wait" jokes shortcut both live in the nav, so they aren't
   duplicated here (the long call label needs the full width). */
export function CallBar() {
  const { Button } = DS;
  return (
    <div className="pt-callbar">
      <Button variant="call" size="lg" href={data.tel}>
        <span className="pt-callbar__label">
          <span className="pt-callbar__action">Call to Order</span>
          <span className="pt-callbar__num">{data.phone}</span>
        </span>
      </Button>
    </div>
  );
}
