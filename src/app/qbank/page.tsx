// @ts-nocheck
'use client';

import React from 'react';

export default function QBankPage() {
  if (typeof window !== 'undefined') {
    window.location.replace('/qbank/register');
    return null;
  }
  return null;
}


