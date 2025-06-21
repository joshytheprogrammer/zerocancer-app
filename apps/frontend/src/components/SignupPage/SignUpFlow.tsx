import patientImage from '@/assets/images/patients.png'
import screeningImage from '@/assets/images/screening.png'
import signupImage from '@/assets/images/signup.png'
import sponsorImage from '@/assets/images/sponsored.png'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import DonorForm from './DonorForm'
import PatientForm from './PatientForm'
import ScreeningCenterForm from './ScreeningCenterForm'
import VerifyEmail from './VerifyEmail'

type UserType = 'patient' | 'donor' | 'screening' | null
type SignUpStep = 'SELECT_TYPE' | 'FILL_FORM' | 'VERIFY_EMAIL'

export default function SignUpFlow() {
  const [selectedType, setSelectedType] = useState<UserType>(null)
  const [step, setStep] = useState<SignUpStep>('SELECT_TYPE')

  const handleTypeSelect = (type: UserType) => {
    setSelectedType(type)
    setStep('FILL_FORM')
  }

  const handleFormSubmit = (data: unknown) => {
    console.log('Form data received in parent:', data)
    setStep('VERIFY_EMAIL')
  }

  const handleBackToSelection = () => {
    setSelectedType(null)
    setStep('SELECT_TYPE')
  }

  const renderUserTypeSelection = () => (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold">Who are you signing up as?</h2>
      <div className="flex gap-4 flex-wrap">
        <div
          className="bg-green-200 p-4 rounded-lg cursor-pointer flex-1 min-w-[200px] flex flex-col items-center hover:bg-green-300 transition-colors duration-300"
          onClick={() => handleTypeSelect('patient')}
        >
          <h3 className="text-2xl font-bold mb-12 w-full">Patient</h3>
          <img
            src={patientImage}
            alt="patient"
            className="h-40 w-auto object-contain"
          />
        </div>
        <div
          className="bg-purple-200 p-4 rounded-lg cursor-pointer flex-1 min-w-[200px] flex flex-col items-center hover:bg-purple-300 transition-colors duration-300"
          onClick={() => handleTypeSelect('donor')}
        >
          <h3 className="text-2xl font-bold mb-12 w-full">Donor</h3>
          <img
            src={sponsorImage}
            alt="patient"
            className="h-40 w-auto object-contain"
          />
        </div>
        <div
          className="bg-blue-200 p-4 rounded-lg cursor-pointer flex-1 min-w-[200px] flex flex-col items-center hover:bg-blue-300 transition-colors duration-300"
          onClick={() => handleTypeSelect('screening')}
        >
          <h3 className="text-2xl font-bold mb-12 w-full">
            Screening Center
          </h3>
          <img
            src={screeningImage}
            alt="patient"
            className="h-40 w-auto object-contain"
          />
        </div>
      </div>
    </div>
  )

  const renderFormWithBackButton = (
    FormComponent: React.ComponentType<{
      onSubmitSuccess: (data: unknown) => void
    }>,
  ) => (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={handleBackToSelection}
          className="text-gray-600 hover:text-gray-800 px-4 py-1 bg-blue-100 rounded-lg cursor-pointer"
        >
          Back
        </button>
      </div>
      <FormComponent onSubmitSuccess={handleFormSubmit} />
    </div>
  )

  const renderContent = () => {
    if (step === 'VERIFY_EMAIL') {
      return <VerifyEmail />
    }

    if (step === 'FILL_FORM') {
      switch (selectedType) {
        case 'patient':
          return renderFormWithBackButton(PatientForm)
        case 'donor':
          return renderFormWithBackButton(DonorForm)
        case 'screening':
          return renderFormWithBackButton(ScreeningCenterForm)
        default:
          return renderUserTypeSelection()
      }
    }

    return renderUserTypeSelection()
  }

  return (
    <div className="flex h-screen p-2">
      {/* Desktop Image - Hidden on mobile */}
      <div className="hidden md:block md:w-1/2 lg:w-2/5">
        <img
          src={signupImage}
          alt="signup"
          className="w-full h-full object-cover rounded-2xl"
        />
      </div>

      {/* Form Section - Full width on mobile, half width on desktop */}
      <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 p-4 lg:p-8">
          <div className="flex">
            <span className="inline-block ml-auto">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold">
                Login
              </Link>
            </span>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
