import { useState, FormEvent, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/authContext';
import Stepper from '../components/Stepper';
import StepOne from '../components/StepOne';
import StepTwo from '../components/StepTwo';
import StepThree from '../components/StepThree';

export default function BecomeATasker() {
  const [currentStep, setCurrentStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [cities, setCities] = useState<string[]>([]);
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
          throw new Error('Неуспешна проверка на достъпа');
        }

        const data = await response.json();

        // Redirect if user doesn't have tasker role
        if (!data.hasTaskerRole) {
          setError('Трябва да имате роля на изпълнител, за да получите достъп до тази страница');
          setTimeout(() => router.push('/'), 2000);
          return;
        }

        // Redirect if user already has a tasker profile
        if (data.hasTaskerProfile) {
          setError('Вече имате профил на изпълнител');
          setTimeout(() => router.push('/'), 2000);
          return;
        }

        // User has access
        setIsCheckingAccess(false);
      } catch (err) {
        console.error('Access check error:', err);
        setError('Неуспешна проверка на достъпа. Пренасочване...');
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

  const handleComplete = () => {
    // Profile creation complete, redirect to home
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {isCheckingAccess ? (
          <div className="text-center">
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Проверка на достъпа...
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Моля, изчакайте, докато проверим вашите права
            </p>
          </div>
        ) : (
          <>
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Станете изпълнител
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Попълнете вашия профил на изпълнител, за да започнете да предлагате услуги
              </p>
            </div>
            
            <Stepper currentStep={currentStep} totalSteps={3} />

            {currentStep === 1 && (
              <StepOne
                userId={userId}
                displayName={displayName}
                setDisplayName={setDisplayName}
                gender={gender}
                setGender={setGender}
                bio={bio}
                setBio={setBio}
                address={address}
                setAddress={setAddress}
                profileImage={profileImage}
                setProfileImage={setProfileImage}
                cities={cities}
                setCities={setCities}
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
              <StepThree
                userId={userId}
                onBack={handlePrevStep}
                onComplete={handleComplete}
                setError={setError}
                setIsLoading={setIsLoading}
                isLoading={isLoading}
              />
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
