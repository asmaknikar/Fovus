import { createRoot } from 'react-dom/client'
import 'tailwindcss/tailwind.css'
import App from 'components/App'
import { Amplify } from 'aws-amplify';
import { a } from 'vitest/dist/suite-a18diDsI.js';


Amplify.configure({
    API: {
        REST: {
            "fovus": {
                endpoint: "https://ymvu3qs951.execute-api.us-east-2.amazonaws.com/prod/",
                region: "us-west-2"
            }
        }            
    }
});
const container = document.getElementById('root') as HTMLDivElement
const root = createRoot(container)

root.render(<App />) 
