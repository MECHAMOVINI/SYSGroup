import { Box, Flex, useColorModeValue } from '@chakra-ui/react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  const bgColor = useColorModeValue('gray.50', 'gray.900')

  return (
    <Flex h="100vh">
      <Sidebar />
      <Box 
        flex="1" 
        bg={bgColor} 
        marginLeft="250px"
      >
        <Header />
        <Box p={8} pt="96px">
          <Outlet />
        </Box>
      </Box>
    </Flex>
  )
} 