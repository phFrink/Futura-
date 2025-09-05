import MainLayout from '@/components/common/layout'
import Dashboard from '@/components/features/dashboard'
import React from 'react'

const DashboardPage = () => {
  return (
    <MainLayout currentPageName="Dashboard">
        <Dashboard />
    </MainLayout>
  )
}

export default DashboardPage