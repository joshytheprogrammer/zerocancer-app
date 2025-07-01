import { Link } from '@tanstack/react-router'

import signupImage from '@/assets/images/signup.png'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <div className="flex h-screen p-2">
      <div className="hidden md:block md:w-1/2 lg:w-2/5">
        <img
          src={signupImage}
          alt="login"
          className="w-full h-full object-cover rounded-2xl"
        />
      </div>

      <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col">
        <div className="flex-shrink-0 p-4 lg:p-8">
          <div className="flex">
            <span className="inline-block ml-auto">
              Don't have an account?{' '}
              <Link to="/sign-up" className="text-primary font-semibold">
                Sign Up
              </Link>
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 flex justify-center">
          <div className="w-full">
            <LoginForm />
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            For Center staff:{' '}
            <Link
              to="/staff/login"
              className="text-primary font-semibold hover:underline"
            >
              Use Staff Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
