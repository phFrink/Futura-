import MainLayout from '@/components/common/layout'
import Reservations from '@/components/features/reservations'



const ReservationsPage = () => {
  return (
    <MainLayout currentPageName="Reservations">
        <Reservations/>
    </MainLayout>
  )
}

export default ReservationsPage