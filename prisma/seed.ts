import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function pic(id: number): string {
  const hue = (id * 47) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect fill="hsl(${hue},30%,90%)" width="400" height="400"/><text fill="hsl(${hue},40%,40%)" font-family="sans-serif" font-size="18" text-anchor="middle" x="200" y="200" dy=".3em">Shop ${id}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

interface ProductSeed {
  name: string;
  desc: string;
  price: number;
  oldPrice: number;
  salesCount?: number;
  specs?: { name: string; values: string[] }[];
  detailProps?: { name: string; value: string }[];
}

async function createProduct(
  data: ProductSeed,
  productId: string,
  categoryId: string,
  brandId: string,
  index: number,
) {
  const picCount = 3 + (index % 3);
  const mainPictures: string[] = [];
  for (let i = 0; i < picCount; i++) {
    mainPictures.push(pic(index * 3 + i));
  }

  const product = await prisma.product.create({
    data: {
      id: productId,
      name: data.name,
      spuCode: `SPU-${productId.slice(-6)}`,
      desc: data.desc,
      price: data.price,
      oldPrice: data.oldPrice,
      discount: Math.round((data.price / data.oldPrice) * 10),
      inventory: 5000 + Math.floor(Math.random() * 5000),
      salesCount: data.salesCount ?? Math.floor(Math.random() * 200),
      commentCount: Math.floor(Math.random() * 50),
      collectCount: Math.floor(Math.random() * 30),
      mainPictures,
      mainVideos: [],
      videoScale: 1,
      brandId,
      categoryId,
    },
  });

  // Detail pictures
  for (const url of mainPictures) {
    await prisma.productDetailPicture.create({
      data: { url, productId: product.id },
    });
  }

  // Detail properties
  const defaultProps = [
    { name: "品牌", value: "官方品牌" },
    { name: "材质", value: "优质材料" },
    { name: "产地", value: "中国大陆" },
  ];
  const props = data.detailProps ?? defaultProps;
  for (const prop of props) {
    await prisma.productDetailProperty.create({
      data: { ...prop, productId: product.id },
    });
  }

  // Specs and SKUs
  const specs = data.specs ?? [{ name: "规格", values: ["标准版"] }];
  const specValueRecords: string[][] = [];

  for (const spec of specs) {
    const s = await prisma.productSpec.create({
      data: { name: spec.name, productId: product.id },
    });
    const values: string[] = [];
    for (const v of spec.values) {
      const sv = await prisma.productSpecValue.create({
        data: { name: v, specId: s.id },
      });
      values.push(sv.id);
    }
    specValueRecords.push(values);
  }

  // Generate SKUs
  const combinations = cartesian(...specValueRecords);
  let skuIdx = 0;
  for (const combo of combinations) {
    const sku = await prisma.productSku.create({
      data: {
        skuCode: `SKU-${productId.slice(-4)}-${++skuIdx}`,
        price: data.price + Math.floor(Math.random() * 20) - 10,
        oldPrice: data.oldPrice + Math.floor(Math.random() * 20) - 10,
        inventory: 500 + Math.floor(Math.random() * 1000),
        productId: product.id,
      },
    });
    for (const svId of combo) {
      await prisma.productSkuSpecValue.create({
        data: { skuId: sku.id, specValueId: svId },
      });
    }
  }
}

function cartesian<T>(...arrays: T[][]): T[][] {
  return arrays.reduce(
    (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
    [[]] as T[][],
  );
}

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.productSkuSpecValue.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.productSku.deleteMany();
  await prisma.productSpecValue.deleteMany();
  await prisma.productSpec.deleteMany();
  await prisma.productDetailPicture.deleteMany();
  await prisma.productDetailProperty.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.user.deleteMany();

  // ===== Users =====
  const hashedPassword = await bcrypt.hash("123456", 10);
  const user = await prisma.user.create({
    data: {
      account: "xiaotuxian001",
      password: hashedPassword,
      mobile: "13219165182",
      avatar: pic(9999),
      nickname: "小兔鲜用户",
      gender: "男",
      birthday: "2000-01-01",
      cityCode: "110100",
      provinceCode: "110000",
      profession: "程序员",
    },
  });

  await prisma.address.create({
    data: {
      userId: user.id,
      receiver: "张三",
      contact: "13219165182",
      provinceCode: "110000",
      cityCode: "110100",
      countyCode: "110101",
      address: "朝阳区某大厦101号",
      isDefault: 0,
      fullLocation: "北京市 北京市 东城区",
    },
  });

  // ===== Brands =====
  const brands = await Promise.all([
    prisma.brand.create({
      data: {
        name: "华为",
        nameEn: "Huawei",
        logo: pic(8001),
        picture: pic(8001),
      },
    }),
    prisma.brand.create({
      data: {
        name: "小米",
        nameEn: "Xiaomi",
        logo: pic(8002),
        picture: pic(8002),
      },
    }),
    prisma.brand.create({
      data: {
        name: "网易严选",
        nameEn: "Yanxuan",
        logo: pic(8003),
        picture: pic(8003),
      },
    }),
    prisma.brand.create({
      data: {
        name: "良品铺子",
        nameEn: "Bestore",
        logo: pic(8004),
        picture: pic(8004),
      },
    }),
    prisma.brand.create({
      data: {
        name: "贝亲",
        nameEn: "Pigeon",
        logo: pic(8005),
        picture: pic(8005),
      },
    }),
  ]);

  // ===== Banners =====
  const bannerData = [
    {
      imgUrl: pic(9001),
      hrefUrl: "/category/cat-home",
      type: "1",
      distributionSite: "1",
    },
    {
      imgUrl: pic(9002),
      hrefUrl: "/category/cat-food",
      type: "1",
      distributionSite: "1",
    },
    {
      imgUrl: pic(9003),
      hrefUrl: "/category/cat-fashion",
      type: "1",
      distributionSite: "1",
    },
    {
      imgUrl: pic(9004),
      hrefUrl: "/category/cat-digital",
      type: "1",
      distributionSite: "1",
    },
    {
      imgUrl: pic(9005),
      hrefUrl: "/category/cat-baby",
      type: "1",
      distributionSite: "1",
    },
  ];
  for (const b of bannerData) {
    await prisma.banner.create({ data: b });
  }

  // ===== Category Tree =====
  // Structure: top-level -> sub-level
  const categoryTree: {
    name: string;
    picture: string;
    children: {
      name: string;
      products: ProductSeed[];
    }[];
  }[] = [
    {
      name: "居家",
      picture: pic(10),
      children: [
        {
          name: "家具",
          products: [
            {
              name: "北欧简约实木床1.8米",
              desc: "进口白橡木，环保水性漆",
              price: 2999,
              oldPrice: 4599,
              specs: [
                { name: "尺寸", values: ["1.5m", "1.8m"] },
                { name: "颜色", values: ["原木色", "胡桃色"] },
              ],
            },
            {
              name: "人体工学办公椅",
              desc: "腰部支撑，久坐不累",
              price: 899,
              oldPrice: 1299,
              specs: [{ name: "颜色", values: ["黑色", "灰色"] }],
            },
            {
              name: "意式极简真皮沙发",
              desc: "头层牛皮，羽绒填充",
              price: 5999,
              oldPrice: 8999,
              specs: [
                { name: "颜色", values: ["米白", "深灰", "橙色"] },
                { name: "尺寸", values: ["三人位", "四人位"] },
              ],
            },
            {
              name: "多功能折叠餐桌",
              desc: "伸缩设计，小户型必备",
              price: 799,
              oldPrice: 1199,
              specs: [{ name: "颜色", values: ["白色", "原木色"] }],
            },
            {
              name: "实木书架落地置物架",
              desc: "多层收纳，稳固耐用",
              price: 459,
              oldPrice: 699,
              detailProps: [
                { name: "材质", value: "松木" },
                { name: "层数", value: "5层" },
              ],
            },
            {
              name: "现代简约鞋柜",
              desc: "大容量，翻斗设计",
              price: 599,
              oldPrice: 899,
              specs: [{ name: "颜色", values: ["白色", "胡桃色"] }],
            },
          ],
        },
        {
          name: "家纺",
          products: [
            {
              name: "60支长绒棉四件套",
              desc: "亲肤透气，不起球",
              price: 399,
              oldPrice: 699,
              specs: [
                { name: "尺寸", values: ["1.5m床", "1.8m床"] },
                { name: "花色", values: ["简约灰", "清新蓝", "暖黄"] },
              ],
            },
            {
              name: "95%白鹅绒被",
              desc: "轻盈保暖，不跑绒",
              price: 1299,
              oldPrice: 1999,
              specs: [{ name: "重量", values: ["200g", "300g"] }],
            },
            {
              name: "乳胶枕头护颈枕",
              desc: "天然乳胶，曲线支撑",
              price: 199,
              oldPrice: 359,
              specs: [{ name: "高度", values: ["10cm", "12cm"] }],
            },
            {
              name: "加厚法兰绒毛毯",
              desc: "双面绒，柔软亲肤",
              price: 129,
              oldPrice: 199,
              specs: [
                { name: "尺寸", values: ["150x200cm", "200x230cm"] },
                { name: "颜色", values: ["灰色", "粉色", "蓝色"] },
              ],
            },
          ],
        },
        {
          name: "灯具",
          products: [
            {
              name: "北欧创意分子灯",
              desc: "艺术设计，轻奢风格",
              price: 599,
              oldPrice: 899,
              specs: [{ name: "头数", values: ["6头", "8头", "10头"] }],
            },
            {
              name: "智能护眼台灯",
              desc: "无频闪，无蓝光危害",
              price: 299,
              oldPrice: 459,
              specs: [{ name: "颜色", values: ["白色", "黑色"] }],
            },
            {
              name: "现代简约吸顶灯",
              desc: "三色调光，遥控控制",
              price: 259,
              oldPrice: 399,
              specs: [{ name: "尺寸", values: ["40cm", "50cm", "60cm"] }],
            },
            {
              name: "氛围落地灯",
              desc: "极简设计，客厅卧室通用",
              price: 349,
              oldPrice: 529,
            },
          ],
        },
      ],
    },
    {
      name: "美食",
      picture: pic(20),
      children: [
        {
          name: "休闲零食",
          products: [
            {
              name: "每日坚果混合装750g",
              desc: "6种坚果果干科学配比",
              price: 99,
              oldPrice: 149,
            },
            {
              name: "手撕牛肉干500g",
              desc: "内蒙古风干，嚼劲十足",
              price: 79,
              oldPrice: 109,
              specs: [{ name: "口味", values: ["原味", "麻辣", "五香"] }],
            },
            {
              name: "北海道白色恋人饼干",
              desc: "酥脆夹心，入口即化",
              price: 59,
              oldPrice: 89,
            },
            {
              name: "山楂条果丹皮组合",
              desc: "酸甜开胃，童年味道",
              price: 29.9,
              oldPrice: 45,
            },
            {
              name: "进口蔓越莓干500g",
              desc: "北美原产，酸甜可口",
              price: 49,
              oldPrice: 69,
            },
            {
              name: "脆脆鲨巧克力威化",
              desc: "多层酥脆，浓郁巧克力",
              price: 39,
              oldPrice: 55,
            },
          ],
        },
        {
          name: "生鲜水果",
          products: [
            {
              name: "智利进口车厘子2斤",
              desc: "JJ级大果，脆甜多汁",
              price: 159,
              oldPrice: 249,
              specs: [{ name: "规格", values: ["2斤装", "5斤装"] }],
            },
            {
              name: "新疆阿克苏冰糖心苹果",
              desc: "18度甜，脆爽多汁",
              price: 49,
              oldPrice: 69,
              specs: [{ name: "规格", values: ["5斤装", "10斤装"] }],
            },
            {
              name: "丹东99草莓3斤",
              desc: "牛奶灌溉，香甜浓郁",
              price: 89,
              oldPrice: 129,
            },
            {
              name: "海南金钻凤梨",
              desc: "树上熟，不用泡盐水",
              price: 39.9,
              oldPrice: 59,
              specs: [{ name: "规格", values: ["2个装", "4个装"] }],
            },
          ],
        },
        {
          name: "酒水饮料",
          products: [
            {
              name: "精酿原浆啤酒330ml*12",
              desc: "德国工艺，麦香浓郁",
              price: 79,
              oldPrice: 119,
            },
            {
              name: "武夷山金骏眉红茶",
              desc: "蜜香甘甜，回甘持久",
              price: 168,
              oldPrice: 258,
              specs: [{ name: "规格", values: ["100g", "250g"] }],
            },
            {
              name: "NFC鲜榨橙汁1L*4",
              desc: "100%纯果汁，非浓缩还原",
              price: 59,
              oldPrice: 89,
            },
            {
              name: "云南小粒咖啡豆500g",
              desc: "中度烘焙，花果香气",
              price: 99,
              oldPrice: 149,
              specs: [{ name: "烘焙度", values: ["中度", "深度"] }],
            },
            {
              name: "巴黎水柠檬味330ml*24",
              desc: "天然含气矿泉水",
              price: 139,
              oldPrice: 189,
            },
          ],
        },
      ],
    },
    {
      name: "服饰",
      picture: pic(30),
      children: [
        {
          name: "女装",
          products: [
            {
              name: "法式复古碎花连衣裙",
              desc: "V领收腰，优雅显瘦",
              price: 189,
              oldPrice: 299,
              specs: [
                { name: "尺码", values: ["S", "M", "L", "XL"] },
                { name: "花色", values: ["蓝色碎花", "粉色碎花"] },
              ],
            },
            {
              name: "高腰直筒牛仔裤",
              desc: "弹力面料，修饰腿型",
              price: 159,
              oldPrice: 239,
              specs: [
                { name: "尺码", values: ["26", "27", "28", "29", "30"] },
                { name: "颜色", values: ["深蓝", "浅蓝", "黑色"] },
              ],
            },
            {
              name: "纯羊毛双面呢大衣",
              desc: "手工缝制，挺括有型",
              price: 899,
              oldPrice: 1599,
              specs: [
                { name: "尺码", values: ["S", "M", "L"] },
                { name: "颜色", values: ["驼色", "燕麦色", "黑色"] },
              ],
            },
            {
              name: "真丝衬衫女长袖",
              desc: "100%桑蚕丝，垂顺透气",
              price: 369,
              oldPrice: 529,
              specs: [
                { name: "尺码", values: ["S", "M", "L", "XL"] },
                { name: "颜色", values: ["白色", "香槟色"] },
              ],
            },
            {
              name: "阔腿休闲裤女",
              desc: "垂感面料，遮肉显瘦",
              price: 139,
              oldPrice: 199,
              specs: [
                { name: "尺码", values: ["S", "M", "L", "XL"] },
                { name: "颜色", values: ["黑色", "卡其", "灰色"] },
              ],
            },
          ],
        },
        {
          name: "男装",
          products: [
            {
              name: "商务休闲弹力西裤",
              desc: "免烫抗皱，修身版型",
              price: 259,
              oldPrice: 399,
              specs: [
                { name: "尺码", values: ["29", "30", "31", "32", "33", "34"] },
                { name: "颜色", values: ["黑色", "深灰", "藏青"] },
              ],
            },
            {
              name: "纯棉牛津纺衬衫",
              desc: "经典领型，百搭单品",
              price: 169,
              oldPrice: 259,
              specs: [
                { name: "尺码", values: ["M", "L", "XL", "XXL"] },
                { name: "颜色", values: ["白色", "蓝色", "灰色"] },
              ],
            },
            {
              name: "轻薄羽绒服男款",
              desc: "90%白鸭绒，可收纳",
              price: 399,
              oldPrice: 699,
              specs: [
                { name: "尺码", values: ["M", "L", "XL", "XXL"] },
                { name: "颜色", values: ["黑色", "藏青"] },
              ],
            },
            {
              name: "男士卫衣连帽衫",
              desc: "加绒保暖，潮流印花",
              price: 149,
              oldPrice: 229,
              specs: [
                { name: "尺码", values: ["M", "L", "XL", "XXL"] },
                { name: "颜色", values: ["黑色", "灰色", "蓝色"] },
              ],
            },
          ],
        },
        {
          name: "童装",
          products: [
            {
              name: "儿童加绒卫衣套装",
              desc: "舒棉绒内里，抵御寒冬",
              price: 199,
              oldPrice: 299,
              specs: [
                {
                  name: "尺码",
                  values: ["80cm", "90cm", "100cm", "110cm", "120cm"],
                },
                { name: "花色", values: ["花与熊", "知更鸟", "五角星"] },
              ],
            },
            {
              name: "宝宝纯棉连体衣",
              desc: "柔软面料，方便穿脱",
              price: 79,
              oldPrice: 119,
              specs: [
                { name: "尺码", values: ["66cm", "73cm", "80cm", "90cm"] },
                { name: "颜色", values: ["粉色", "蓝色", "黄色"] },
              ],
            },
            {
              name: "儿童羊羔绒外套",
              desc: "宽松版型，休闲风格",
              price: 99,
              oldPrice: 159,
              specs: [
                { name: "尺码", values: ["80cm", "90cm", "100cm", "110cm"] },
                { name: "颜色", values: ["米白", "粉色"] },
              ],
            },
            {
              name: "儿童运动鞋",
              desc: "透气网面，防滑鞋底",
              price: 129,
              oldPrice: 199,
              specs: [
                {
                  name: "尺码",
                  values: ["26码", "27码", "28码", "29码", "30码"],
                },
                { name: "颜色", values: ["黑色", "粉色", "蓝色"] },
              ],
            },
            {
              name: "女童公主裙",
              desc: "网纱蓬蓬裙，甜美可爱",
              price: 159,
              oldPrice: 239,
              specs: [
                { name: "尺码", values: ["90cm", "100cm", "110cm", "120cm"] },
                { name: "颜色", values: ["粉色", "白色"] },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "数码",
      picture: pic(40),
      children: [
        {
          name: "手机",
          products: [
            {
              name: "5G智能手机 8+256G",
              desc: "骁龙芯片，5000mAh大电池",
              price: 2999,
              oldPrice: 3699,
              specs: [
                { name: "颜色", values: ["幻夜黑", "冰岛白", "极光蓝"] },
                { name: "配置", values: ["8+128G", "8+256G"] },
              ],
            },
            {
              name: "折叠屏手机",
              desc: "内外双屏，轻薄折叠",
              price: 7999,
              oldPrice: 9999,
              specs: [
                { name: "颜色", values: ["雅黑", "素白"] },
                { name: "配置", values: ["12+256G", "12+512G"] },
              ],
            },
            {
              name: "拍照手机 12+256G",
              desc: "一亿像素，50倍变焦",
              price: 3599,
              oldPrice: 4299,
              specs: [
                { name: "颜色", values: ["亮黑", "幻彩"] },
                { name: "配置", values: ["8+128G", "12+256G"] },
              ],
            },
            {
              name: "学生备用机",
              desc: "大字体大音量，超长待机",
              price: 599,
              oldPrice: 799,
            },
          ],
        },
        {
          name: "电脑",
          products: [
            {
              name: "轻薄笔记本14英寸",
              desc: "i5处理器，16G内存，512G固态",
              price: 4999,
              oldPrice: 5999,
              specs: [
                { name: "配置", values: ["i5/16G/512G", "i7/16G/1T"] },
                { name: "颜色", values: ["银色", "深空灰"] },
              ],
            },
            {
              name: "游戏本15.6英寸",
              desc: "RTX4060独显，144Hz高刷屏",
              price: 6999,
              oldPrice: 8499,
              specs: [{ name: "配置", values: ["i7/16G/512G", "i9/32G/1T"] }],
            },
            {
              name: "27英寸4K显示器",
              desc: "IPS面板，Type-C一线连",
              price: 1999,
              oldPrice: 2699,
            },
            {
              name: "机械键盘87键",
              desc: "Cherry轴体，RGB背光",
              price: 399,
              oldPrice: 599,
              specs: [{ name: "轴体", values: ["红轴", "青轴", "茶轴"] }],
            },
            {
              name: "无线鼠标静音",
              desc: "双模连接，人体工学设计",
              price: 99,
              oldPrice: 159,
              specs: [{ name: "颜色", values: ["黑色", "白色", "粉色"] }],
            },
          ],
        },
        {
          name: "智能穿戴",
          products: [
            {
              name: "智能手表",
              desc: "血氧监测，14天续航",
              price: 899,
              oldPrice: 1199,
              specs: [
                { name: "颜色", values: ["黑色", "银色", "金色"] },
                { name: "尺寸", values: ["42mm", "46mm"] },
              ],
            },
            {
              name: "真无线降噪耳机",
              desc: "主动降噪，28小时续航",
              price: 499,
              oldPrice: 699,
              specs: [{ name: "颜色", values: ["白色", "黑色", "蓝色"] }],
            },
            {
              name: "智能手环",
              desc: "全天心率监测，50米防水",
              price: 199,
              oldPrice: 299,
              specs: [{ name: "颜色", values: ["黑色", "橙色"] }],
            },
            {
              name: "智能体脂秤",
              desc: "17项身体数据，APP同步",
              price: 99,
              oldPrice: 159,
            },
          ],
        },
      ],
    },
    {
      name: "母婴",
      picture: pic(50),
      children: [
        {
          name: "奶粉辅食",
          products: [
            {
              name: "婴儿配方奶粉3段900g",
              desc: "DHA+ARA，近似母乳配方",
              price: 298,
              oldPrice: 398,
              specs: [{ name: "段位", values: ["1段", "2段", "3段"] }],
            },
            {
              name: "高铁米粉婴儿辅食",
              desc: "强化铁锌钙，细腻易吸收",
              price: 59,
              oldPrice: 79,
            },
            {
              name: "宝宝果泥混合装",
              desc: "进口水果，不加糖不加水",
              price: 89,
              oldPrice: 129,
              specs: [
                { name: "口味", values: ["混合水果", "苹果香蕉", "梨泥"] },
              ],
            },
            {
              name: "婴幼儿溶豆小零食",
              desc: "入口即化，锻炼抓握",
              price: 39,
              oldPrice: 59,
              specs: [{ name: "口味", values: ["原味", "草莓", "酸奶"] }],
            },
          ],
        },
        {
          name: "尿裤湿巾",
          products: [
            {
              name: "婴儿纸尿裤L码54片",
              desc: "超薄透气，12小时干爽",
              price: 89,
              oldPrice: 129,
              specs: [{ name: "尺码", values: ["S", "M", "L", "XL"] }],
            },
            {
              name: "婴儿湿巾80抽*6包",
              desc: "EDI纯水，手口可用",
              price: 49,
              oldPrice: 69,
            },
            {
              name: "拉拉裤XL码40片",
              desc: "弹力腰围，穿脱方便",
              price: 99,
              oldPrice: 139,
              specs: [{ name: "尺码", values: ["L", "XL", "XXL"] }],
            },
            {
              name: "婴儿棉柔巾100抽*6",
              desc: "干湿两用，不掉絮",
              price: 59,
              oldPrice: 79,
            },
          ],
        },
        {
          name: "益智玩具",
          products: [
            {
              name: "大块积木拼装100粒",
              desc: "安全大颗粒，创意拼搭",
              price: 129,
              oldPrice: 199,
            },
            {
              name: "儿童早教故事机",
              desc: "海量资源，AI智能对话",
              price: 199,
              oldPrice: 299,
              specs: [{ name: "颜色", values: ["粉色", "蓝色"] }],
            },
            {
              name: "磁力片积木100片",
              desc: "强磁吸附，立体搭建",
              price: 159,
              oldPrice: 249,
            },
            {
              name: "儿童绘画板液晶手写板",
              desc: "无尘无墨，一键清除",
              price: 69,
              oldPrice: 99,
              specs: [{ name: "尺寸", values: ["8.5寸", "12寸"] }],
            },
            {
              name: "遥控车越野攀爬车",
              desc: "四驱动力，防滑轮胎",
              price: 179,
              oldPrice: 259,
              specs: [{ name: "颜色", values: ["红色", "蓝色", "绿色"] }],
            },
          ],
        },
      ],
    },
  ];

  // Create categories and products
  let catCounter = 1;
  let prodCounter = 1;
  let brandIdx = 0;

  for (const topCat of categoryTree) {
    const topCatId = `cat${String(catCounter++).padStart(3, "0")}`;
    const top = await prisma.category.create({
      data: {
        id: topCatId,
        name: topCat.name,
        picture: topCat.picture,
        layer: 1,
      },
    });

    for (const subCat of topCat.children) {
      const subCatId = `cat${String(catCounter++).padStart(3, "0")}`;
      const sub = await prisma.category.create({
        data: {
          id: subCatId,
          name: subCat.name,
          picture: pic(60 + catCounter),
          layer: 2,
          parentId: topCatId,
        },
      });

      const brand = brands[brandIdx % brands.length];
      brandIdx++;

      for (const prodData of subCat.products) {
        const prodId = `prod${String(prodCounter).padStart(4, "0")}`;
        await createProduct(prodData, prodId, subCatId, brand.id, prodCounter);
        prodCounter++;
      }
    }
  }

  console.log(`Seed complete! Created:`);
  console.log(`  ${categoryTree.length} top-level categories`);
  console.log(
    `  ${categoryTree.reduce((s, c) => s + c.children.length, 0)} sub-categories`,
  );
  console.log(`  ${prodCounter - 1} products`);
  console.log("");
  console.log("Test account: xiaotuxian001 / 123456");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
