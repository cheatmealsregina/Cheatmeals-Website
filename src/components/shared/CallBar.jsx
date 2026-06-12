import React from 'react';
import { ThemeToggle } from './ThemeToggle.jsx';

const DS = window.CheatMealsDesignSystem_e4e564;
const data = window.CM_DATA;

/* Mobile sticky bottom bar — call button + theme toggle. */
export function CallBar() {
  const { Button } = DS;
  return (
    <div className="pt-callbar">
      <Button variant="call" size="lg" href={data.tel}>
        {'Call to Order · ' + data.phone}
      </Button>
      <ThemeToggle />
    </div>
  );
}
