'use client';

import React from 'react'
import { redirect } from 'next/navigation'

export default function Page() {
  // Redirect to client-home as the main homepage
  redirect('/client-home')
}