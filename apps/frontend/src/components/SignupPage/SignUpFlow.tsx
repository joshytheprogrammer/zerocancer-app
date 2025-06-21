import signupImage from '@/assets/images/signup.png'
import patientImage from '@/assets/images/patients.png'
import sponsorImage from '@/assets/images/sponsored.png'
import screeningImage from '@/assets/images/screening.png'
import { useState } from 'react'
import PatientForm from './PatientForm'
import DonorForm from './DonorForm'
import ScreeningCenterForm from './ScreeningCenterForm'

type UserType = 'patient' | 'donor' | 'screening' | null

export default function SignUpFlow() {
  const [selectedType, setSelectedType] = useState<UserType>(null)

  const renderUserTypeSelection = () => (
    <div className='space-y-8'>
      <h2 className='text-3xl font-bold'>Who are you signing up as?</h2>
      <div className='flex gap-4 flex-wrap'>
        <div 
          className='bg-green-200 p-4 rounded-lg cursor-pointer flex-1 min-w-[200px] flex flex-col items-center hover:bg-green-300 transition-colors duration-300'
          onClick={() => setSelectedType('patient')}
        >
          <h3 className='text-2xl font-bold mb-12 w-full'>Patient</h3>
          <img src={patientImage} alt="patient" className='h-40 w-auto object-contain'/>
        </div>
        <div 
          className='bg-purple-200 p-4 rounded-lg cursor-pointer flex-1 min-w-[200px] flex flex-col items-center hover:bg-purple-300 transition-colors duration-300'
          onClick={() => setSelectedType('donor')}
        >
          <h3 className='text-2xl font-bold mb-12 w-full'>Donor</h3>
          <img src={sponsorImage} alt="patient" className='h-40 w-auto object-contain'/>
        </div>
        <div 
          className='bg-blue-200 p-4 rounded-lg cursor-pointer flex-1 min-w-[200px] flex flex-col items-center hover:bg-blue-300 transition-colors duration-300'
          onClick={() => setSelectedType('screening')}
        >
          <h3 className='text-2xl font-bold mb-12 w-full'>Screening Center</h3>
          <img src={screeningImage} alt="patient" className='h-40 w-auto object-contain'/>
        </div>
      </div>
    </div>
  )

  const renderFormWithBackButton = (FormComponent: React.ComponentType, title: string) => (
    <div className='space-y-8'>
      <div className='flex items-center gap-4'>
        <button 
          onClick={() => setSelectedType(null)}
          className='text-gray-600 hover:text-gray-800 px-4 py-1 bg-blue-100 rounded-lg cursor-pointer'
        >
           Back
        </button>
      </div>
      <FormComponent />
    </div>
  )

  return (
    <div className="flex h-screen p-2">
      {/* Desktop Image - Hidden on mobile */}
      <div className="hidden md:block md:w-1/2 lg:w-2/5">
        <img src={signupImage} alt="signup" className="w-full h-full object-cover rounded-2xl"/>
      </div>
      
      {/* Form Section - Full width on mobile, half width on desktop */}
      <div className='w-full md:w-1/2 lg:w-3/5 flex flex-col'>
        {/* Header - Fixed */}
        <div className="flex-shrink-0 p-4 lg:p-8">
          <div className="flex">
            <span className='inline-block ml-auto'>Already have an account? <a href="/login" className='text-primary font-semibold'>Login</a></span>
          </div>
        </div>
        
        {/* Content - Scrollable */}
        <div className='flex-1 overflow-y-auto p-4 lg:p-8'>
          {selectedType === null && renderUserTypeSelection()}
          {selectedType === 'patient' && renderFormWithBackButton(PatientForm, 'Patient Registration')}
          {selectedType === 'donor' && renderFormWithBackButton(DonorForm, 'Donor Registration')}
          {selectedType === 'screening' && renderFormWithBackButton(ScreeningCenterForm, 'Screening Center Registration')}
        </div>
      </div>
    </div>
  )
}