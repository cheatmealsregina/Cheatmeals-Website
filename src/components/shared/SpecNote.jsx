import React from 'react';

const DS = window.CheatMealsDesignSystem_e4e564;

/* Dashed annotation marking things the prototype fakes. */
export function SpecNote({ children }) {
  const { Icon } = DS;
  return (
    <div className="pt-specnote">
      <Icon name="alert" size={14} />
      <span>{children}</span>
    </div>
  );
}
