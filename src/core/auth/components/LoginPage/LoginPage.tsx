import { Anchor, Box, Container, Flex, Group, Stack, Text } from "@mantine/core";
import type { LoginDto } from "../../dto";
import { BrandMark } from "../../../../common/component/BrandMark";
import { LoginForm } from "../LoginForm";
import { LoginHero } from "../LoginHero";
import classes from "./LoginPage.module.scss";

interface LoginPageProps {
  loading?: boolean;
  onSubmit?: (values: LoginDto) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  loading,
  onSubmit,
}) => {
  return (
    <Flex p={{ base: "md", md: "lg" }} gap="lg" className={classes.root}>
      <Stack flex={1} gap="xl" className={classes.panel}>
        <BrandMark />

        <Container size={420} w="100%" flex={1} px={0}>
          <Flex className={classes.formWrapper}>
            <Box className={classes.form}>
              <LoginForm
                loading={loading}
                onSubmit={onSubmit}
              />
            </Box>
          </Flex>
        </Container>

        <Group justify="space-between" wrap="wrap" gap="xs">
          <Text fz="xs" c="dimmed">
            Copyright &copy; {new Date().getFullYear()} simpwf Enterprises LTD.
          </Text>
          <Anchor component="button" type="button" fz="xs" c="dimmed">
            Privacy Policy
          </Anchor>
        </Group>
      </Stack>

      <Box flex={1} visibleFrom="md">
        <LoginHero />
      </Box>
    </Flex>
  );
};
