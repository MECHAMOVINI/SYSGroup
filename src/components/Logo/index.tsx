import React from 'react';
import { Box, Flex, Text, BoxProps } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

interface LogoProps extends BoxProps {
  showTagline?: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  linkTo?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  showTagline = false, 
  color = '#00AEEF', 
  size = 'md',
  linkTo,
  ...rest 
}) => {
  // Configurações de tamanho
  const sizeConfig = {
    sm: { logoHeight: '24px', fontSize: '8px' },
    md: { logoHeight: '40px', fontSize: '10px' },
    lg: { logoHeight: '60px', fontSize: '14px' },
  };

  const { logoHeight, fontSize } = sizeConfig[size];

  const content = (
    <Flex direction="column" alignItems="center" {...rest}>
      <Box textAlign="center">
        <Text 
          fontSize={fontSize}
          fontWeight="bold" 
          color={color} 
          lineHeight="1"
          textTransform="uppercase"
          letterSpacing="wider"
        >
          TECNOLOGIAS
        </Text>
        <Text 
          fontSize={`calc(${fontSize} * 2)`} 
          fontWeight="bold"
          color={color}
          lineHeight="1"
          letterSpacing="wider"
        >
          SYSGROUP
        </Text>
      </Box>
      
      {showTagline && (
        <Text 
          mt={1} 
          fontSize={`calc(${fontSize} * 0.8)`} 
          color="gray.500"
        >
          Soluções Integradas de Gestão
        </Text>
      )}
    </Flex>
  );

  if (linkTo) {
    return <Link to={linkTo}>{content}</Link>;
  }

  return content;
};

export default Logo; 