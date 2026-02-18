import React from 'react'
import { Container, Typography as Typhography, Box, TextField , FormControl, InputLabel, Select, MenuItem,Button} from '@mui/material'
import axios from 'axios'

function App() {

  const [emailContent, setEmailContent] = React.useState('');
  const [tone, setTone] = React.useState('');

  const [loading, setLoading] = React.useState (false);
  const [generatedReply, setGeneratedReply] = React.useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8080/api/email/generate', {
        emailContent,
        tone
        });
        setGeneratedReply(typeof response.data === 'string' ? response.data : JSON.stringify(response.data));
        
  } catch (error) {
    console.error('Error generating email reply:', error);

  } finally {
    setLoading(false);
  }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typhography variant="h4" component="h1" gutterBottom>
        Welcome to Email Writer
      </Typhography>
      <Box sx={{ mt: 4 }}>
        <TextField
          fullWidth
          multiline
          rows={6}
          variant="outlined"
          label="Compose your email here"
          value={emailContent || ''}
          onChange={(e) => setEmailContent(e.target.value)}
        />

         <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Tone (Optional)</InputLabel>
          <Select
            value={tone || ''}
            label="Tone (Optional)"
            onChange={(e) => setTone(e.target.value)}
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="professional">Professional</MenuItem>
            <MenuItem value="casual">Casual</MenuItem>
            <MenuItem value="friendly">Friendly</MenuItem>
          </Select>
      </FormControl>

      <Button variant="contained" sx={{ mt: 2 }} disabled ={!emailContent || loading}  onClick={handleSubmit}> 
        Submit
      </Button>
      </Box>
      <Box sx={{ mt: 4 }}>
        <TextField
          fullWidth
          multiline
          rows={6}
          variant="outlined"
          value={generatedReply || ''}
          inputProps={{readonly:true}}
        />

        <Button variant="outlined" sx={{ mt: 2 }} disabled ={!generatedReply || loading}  onClick={() => {navigator.clipboard.writeText(generatedReply)}}> 
        Copy to Clipboard
      </Button>
        </Box>   
    </Container>
  )
}

export default App
