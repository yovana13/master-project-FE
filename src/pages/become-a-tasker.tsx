import { useState, FormEvent, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/authContext';
import Stepper from '../components/Stepper';
import StepOne from '../components/StepOne';
import StepTwo from '../components/StepTwo';

export default function BecomeATasker() {
  const [currentStep, setCurrentStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [serviceRadiusKm, setServiceRadiusKm] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const router = useRouter();
  const { userId } = useContext(AuthContext);

  useEffect(() => {
    const checkAccess = async () => {
      if (!userId) {
        router.push('/login');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3007/users/tasker-profile/check/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to check access');
        }

        const data = await response.json();

        // Redirect if user doesn't have tasker role
        if (!data.hasTaskerRole) {
          setError('You must have a tasker role to access this page');
          setTimeout(() => router.push('/'), 2000);
          return;
        }

        // Redirect if user already has a tasker profile
        if (data.hasTaskerProfile) {
          setError('You already have a tasker profile');
          setTimeout(() => router.push('/'), 2000);
          return;
        }

        // User has access
        setIsCheckingAccess(false);
      } catch (err) {
        console.error('Access check error:', err);
        setError('Failed to verify access. Redirecting...');
        setTimeout(() => router.push('/'), 2000);
      }
    };

    checkAccess();
  }, [userId, router]);

  const handleNextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {isCheckingAccess ? (
          <div className="text-center">
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Verifying access...
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Please wait while we check your permissions
            </p>
          </div>
        ) : (
          <>
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Become a Tasker
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Complete your tasker profile to start offering services
              </p>
            </div>
            
            <Stepper currentStep={currentStep} totalSteps={3} />

            {currentStep === 1 && (
              <StepOne
                userId={userId}
                displayName={displayName}
                setDisplayName={setDisplayName}
                bio={bio}
                setBio={setBio}
                serviceRadiusKm={serviceRadiusKm}
                setServiceRadiusKm={setServiceRadiusKm}
                profileImage={profileImage}
                setProfileImage={setProfileImage}
                onNext={handleNextStep}
                setError={setError}
                setIsLoading={setIsLoading}
                isLoading={isLoading}
              />
            )}

            {currentStep === 2 && (
              <StepTwo
                userId={userId}
                onNext={handleNextStep}
                onBack={handlePrevStep}
                setError={setError}
                setIsLoading={setIsLoading}
                isLoading={isLoading}
              />
            )}

            {currentStep === 3 && (
              <div className="mt-8 space-y-6">
                <p className="text-center text-gray-600">Step 3 - Coming soon</p>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Back() => router.push('/')}
                    className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Finish
                    disabled={isLoading}
                    className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Complete Profile'}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 p-4 mt-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
