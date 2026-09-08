import { Image, Text } from "@mantine/core";
import logo from "../../../../assets/Gemini_Generated_Image_cn474zcn474zcn47 (1).jpg";
import classes from "./BrandMark.module.scss";

interface BrandMarkProps {
  size?: number;
}

export const BrandMark: React.FC<BrandMarkProps> = ({ size = 32 }) => {
  return (
    <div className={classes.root}>
      <Image
        src={logo}
        alt="simpwf"
        w={size}
        h={size}
        className={classes.logo}
      />
      <Text fz={size * 0.62} className={classes.name}>
        simpwf
      </Text>
    </div>
  );
};
