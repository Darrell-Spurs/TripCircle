import { useParams, useNavigate } from 'react-router-dom'
import { useSharedLocationFolder, useImportLocationFolder } from '../hooks/useLocationFolderShare'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { SavedLocation } from '../types'

export default function ShareLocationFolder() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user, isGuest } = useAuth()
  const { t } = useLanguage()
  const { data, isLoading } = useSharedLocationFolder(token || '')
  const importFolder = useImportLocationFolder()

  const isLoggedIn = !!user && !isGuest

  const handleImport = async () => {
    if (!token || !data) return
    
    if (!isLoggedIn) {
      alert(t.share.pleaseLoginToImport || 'Please login to import this collection')
      const currentPath = `/location-folders/shared/${token}`
      navigate(`/auth/login?return=${encodeURIComponent(currentPath)}`)
      return
    }

    try {
      const result = await importFolder.mutateAsync(data.folder.id)
      alert(t.locationFolders.folderImportedSuccess?.replace('{name}', result.name) || `Collection "${result.name}" imported successfully!`)
      navigate(`/location-folders`)
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to import collection')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">{t.common.loading}</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Collection not found</h2>
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:text-indigo-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  const { folder } = data

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">{t.locationFolders.sharedCollectionReadOnly || 'This is a shared collection. You can view it and import it to your account.'}</p>
          <button
            onClick={handleImport}
            disabled={importFolder.isPending}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 text-sm flex items-center gap-2"
          >
            {importFolder.isPending ? (
              t.common.loading
            ) : (
              <>
                <span>📥</span>
                {t.locationFolders.importToMyCollections || 'Import to My Collections'}
              </>
            )}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{folder.name}</h1>
              {folder.description && (
                <p className="text-gray-600 mb-4">{folder.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <p>
                  <span className="font-semibold">{t.locationFolders.locations}:</span>{' '}
                  {folder.locations?.length || 0}
                </p>
                {folder.isPublic && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                    {t.photos.public}
                  </span>
                )}
              </div>
            </div>
            {folder.owner && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{t.locationFolders.by || 'By'}:</span>
                {folder.owner.avatarUrl ? (
                  <img
                    src={folder.owner.avatarUrl}
                    alt={folder.owner.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 font-medium text-xs">
                      {folder.owner.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="font-medium">{folder.owner.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">{t.locationFolders.locations}</h2>
          {folder.locations && folder.locations.length > 0 ? (
            <div className="space-y-3">
              {folder.locations.map((location: SavedLocation) => (
                <div
                  key={location.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <h3 className="font-semibold text-lg mb-1">{location.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{location.address}</p>
                  {location.notes && (
                    <p className="text-sm text-gray-700 mt-2">{location.notes}</p>
                  )}
                  {location.tags && location.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {location.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">{t.locationFolders.noLocations || 'No locations in this collection'}</p>
          )}
        </div>
      </div>
    </div>
  )
}

